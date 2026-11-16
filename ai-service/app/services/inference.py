import json
import os
import re
import joblib
import numpy as np
import tensorflow as tf
from app.core.config import settings
from app.schemas.predict import PredictionResponse

class InferenceService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.metadata = {}
        self.clases_originales = ["Kama", "Rosa", "Canadian"]
        self.mapeo_pqr = {
            0: "Atención Médica",
            1: "Facturación",
            2: "Farmacia"
        }
        self.version = "1.0.0-seeds-mlp"

    def load_artifacts(self):
        """Carga en memoria el modelo neuronal HDF5, el StandardScaler y los metadatos."""
        model_path = settings.get_absolute_path(settings.MODEL_PATH)
        scaler_path = settings.get_absolute_path(settings.SCALER_PATH)
        metadata_path = settings.get_absolute_path(settings.METADATA_PATH)

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Archivo de modelo no encontrado en: {model_path}")
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"Archivo de escalador no encontrado en: {scaler_path}")

        print(f"[InferenceService] Cargando modelo desde: {model_path}")
        self.model = tf.keras.models.load_model(model_path)

        print(f"[InferenceService] Cargando StandardScaler desde: {scaler_path}")
        self.scaler = joblib.load(scaler_path)

        if os.path.exists(metadata_path):
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
                self.version = self.metadata.get("version", self.version)
                if "clases_originales" in self.metadata:
                    self.clases_originales = self.metadata["clases_originales"]
                if "mapeo_pqr" in self.metadata:
                    self.mapeo_pqr = {int(k): v for k, v in self.metadata["mapeo_pqr"].items()}

        print("[InferenceService] Artefactos cargados exitosamente.")

    def is_ready(self) -> bool:
        return self.model is not None and self.scaler is not None

    def extract_features_from_text(self, texto: str) -> np.ndarray:
        """
        Adaptador que proyecta métricas estadísticas y morfológicas del texto libre
        hacia un vector de 7 dimensiones compatibles con el StandardScaler del modelo Seeds.
        """
        limpio = (texto or "").strip()
        if not limpio:
            # Vector neutro con valores medios típicos del dataset
            return np.array([[14.8, 14.5, 0.87, 5.6, 3.2, 2.7, 5.1]], dtype=np.float32)

        longitud_total = float(len(limpio))
        palabras = re.findall(r"\w+", limpio.lower())
        total_palabras = float(max(len(palabras), 1))

        # 1. Indicador de extensión o área discursiva
        feat_1 = float(min(max(longitud_total / 20.0, 10.0), 22.0))

        # 2. Indicador perimetral (amplitud léxica)
        palabras_unicas = float(len(set(palabras)))
        feat_2 = float(min(max(palabras_unicas * 0.8, 11.0), 20.0))

        # 3. Compacidad discursiva (riqueza léxica: únicas / totales normalizado)
        densidad = palabras_unicas / total_palabras
        feat_3 = float(min(max(0.75 + (densidad * 0.2), 0.80), 0.95))

        # 4. Longitud promedio de términos (longitud_grano)
        longitud_promedio_palabra = sum(len(p) for p in palabras) / total_palabras
        feat_4 = float(min(max(longitud_promedio_palabra, 4.0), 7.0))

        # 5. Ancho discursivo (proporción de conectores y términos medianos)
        terminos_medianos = sum(1 for p in palabras if 4 <= len(p) <= 8)
        feat_5 = float(min(max((terminos_medianos / total_palabras) * 5.0, 2.0), 4.5))

        # 6. Coeficiente de asimetría discursiva (proporción de mayúsculas y exclamaciones)
        mayusculas = sum(1 for c in limpio if c.isupper())
        puntuacion = sum(1 for c in limpio if c in "!?,.;:")
        asimetria = (mayusculas * 1.5 + puntuacion * 2.0) / total_palabras
        feat_6 = float(min(max(asimetria * 3.0, 0.5), 8.5))

        # 7. Longitud de oraciones (ranura)
        oraciones = [s for s in re.split(r"[.!?]+", limpio) if s.strip()]
        total_oraciones = float(max(len(oraciones), 1))
        feat_7 = float(min(max((total_palabras / total_oraciones) * 0.4, 4.0), 7.0))

        return np.array([[feat_1, feat_2, feat_3, feat_4, feat_5, feat_6, feat_7]], dtype=np.float32)

    def predict(self, features: list = None, texto: str = None) -> PredictionResponse:
        """
        Ejecuta el pipeline determinista:
        1. Preparación de variables numéricas (directas o vía adaptador de texto).
        2. Escalado con StandardScaler (scaler.transform).
        3. Inferencia con la red neuronal entrenada (model.predict).
        4. Argmax sobre la capa Softmax y mapeo de categoría.
        """
        if not self.is_ready():
            raise RuntimeError("El modelo o escalador no se encuentran inicializados.")

        metodo = "features_directas"
        if features is not None and len(features) == 7:
            X_crudo = np.array([features], dtype=np.float32)
        elif texto:
            metodo = "adaptacion_texto"
            X_crudo = self.extract_features_from_text(texto)
        else:
            raise ValueError("Se requiere proporcionar 'features' (7 valores) o 'texto' para la inferencia.")

        # 2. StandardScaler ajustado en entrenamiento
        X_escalado = self.scaler.transform(X_crudo)

        # 3. Predicción con la red neuronal Keras
        probabilidades = self.model.predict(X_escalado, verbose=0)
        prob_lista = [float(p) for p in probabilidades[0]]

        # 4. Decodificación mediante argmax
        indice = int(np.argmax(probabilidades, axis=1)[0])
        confianza = float(prob_lista[indice])

        clase_orig = self.clases_originales[indice] if indice < len(self.clases_originales) else f"Clase_{indice}"
        categoria = self.mapeo_pqr.get(indice, "Atención Médica")

        return PredictionResponse(
            categoria_predicha=categoria,
            indice_clase=indice,
            confianza=round(confianza, 4),
            clase_modelo_original=clase_orig,
            probabilidades=[round(p, 4) for p in prob_lista],
            version_modelo=self.version,
            metodo_inferencia=metodo
        )

inference_service = InferenceService()
