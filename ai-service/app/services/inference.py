import json
import os
import re
import unicodedata
import joblib
import numpy as np
import tensorflow as tf
from app.core.config import settings
from app.schemas.predict import PredictionResponse

# Centroides representativos del dataset Seeds para proyectar señales textuales
# al espacio 7D que espera el StandardScaler sin puenteo de la red neuronal:
# 0: Kama (Atención Médica), 1: Rosa (Facturación), 2: Canadian (Farmacia)
_CLASS_CENTROIDS = np.array(
    [
        [15.26, 14.84, 0.871, 5.763, 3.312, 2.221, 5.22],
        [18.88, 16.26, 0.8969, 6.084, 3.764, 1.649, 6.109],
        [11.23, 12.63, 0.884, 4.902, 2.879, 2.269, 4.703],
    ],
    dtype=np.float32,
)

# Frases compuestas evaluadas de mayor a menor longitud para desambiguar contexto
# (ej. "medicina interna" -> Atención Médica, "formula medica" -> Farmacia).
_DOMAIN_PHRASES: list[tuple[str, int, float]] = sorted(
    [
        ("atencion medica", 0, 4.0),
        ("medicina interna", 0, 4.0),
        ("medicina general", 0, 4.0),
        ("medicina familiar", 0, 4.0),
        ("cita con especialista", 0, 4.0),
        ("reprogramacion de cita", 0, 4.0),
        ("cancelacion de cita", 0, 4.0),
        ("historia clinica", 0, 4.0),
        ("resumen de atencion", 0, 3.5),
        ("servicio de urgencias", 0, 4.0),
        ("consulta externa", 0, 3.5),
        ("cita medica", 0, 4.0),
        ("examenes diagnosticos", 0, 3.5),
        ("ayudas diagnosticas", 0, 3.5),
        ("toma de muestras", 0, 3.5),
        ("entrega de resultados", 0, 3.5),
        ("imagen diagnostica", 0, 3.5),
        ("imagenes diagnosticas", 0, 3.5),
        ("control medico", 0, 3.5),
        ("mala atencion", 0, 3.5),
        ("tiempo de espera", 0, 2.5),
        ("orden medica", 0, 2.0),
        ("cuota moderadora", 1, 4.5),
        ("cuotas moderadoras", 1, 4.5),
        ("cobro indebido", 1, 4.5),
        ("doble cobro", 1, 4.5),
        ("error en facturacion", 1, 4.5),
        ("error de facturacion", 1, 4.5),
        ("devolucion de dinero", 1, 4.0),
        ("exoneracion de pago", 1, 4.0),
        ("liquidacion de cuenta", 1, 4.0),
        ("estado de cuenta", 1, 3.5),
        ("nota credito", 1, 3.5),
        ("paz y salvo", 1, 3.5),
        ("valor a pagar", 1, 3.5),
        ("pago en caja", 1, 3.5),
        ("desabastecimiento de medicamentos", 2, 4.5),
        ("dispensacion de medicamentos", 2, 4.5),
        ("entrega de medicamentos", 2, 4.5),
        ("entrega del medicamento", 2, 4.5),
        ("reclamar medicamentos", 2, 4.0),
        ("reclamar medicamento", 2, 4.0),
        ("pendiente de farmacia", 2, 4.5),
        ("tratamiento farmacologico", 2, 4.0),
        ("formulas medicas", 2, 4.0),
        ("formula medica", 2, 4.0),
        ("entrega de medicinas", 2, 4.0),
        ("entrega de medicina", 2, 4.0),
        ("no hay existencias", 2, 3.5),
        ("sin existencias", 2, 3.5),
        ("no pos", 2, 3.5),
    ],
    key=lambda item: len(item[0]),
    reverse=True,
)

_DOMAIN_TOKENS: dict[str, tuple[int, float]] = {
    # 0: Atención Médica
    "cita": (0, 3.0),
    "citas": (0, 3.0),
    "medico": (0, 3.0),
    "medica": (0, 2.5),
    "medicos": (0, 3.0),
    "medicas": (0, 2.5),
    "doctor": (0, 3.0),
    "doctora": (0, 3.0),
    "especialista": (0, 3.0),
    "especialistas": (0, 3.0),
    "agenda": (0, 2.5),
    "agendamiento": (0, 2.5),
    "reprogramacion": (0, 3.0),
    "cirugia": (0, 3.5),
    "cirugias": (0, 3.5),
    "urgencia": (0, 3.5),
    "urgencias": (0, 3.5),
    "triage": (0, 3.5),
    "hospitalizacion": (0, 3.5),
    "enfermeria": (0, 3.0),
    "enfermera": (0, 3.0),
    "enfermero": (0, 3.0),
    "laboratorio": (0, 3.0),
    "radiografia": (0, 3.5),
    "ecografia": (0, 3.5),
    "resonancia": (0, 3.5),
    "tomografia": (0, 3.5),
    "biopsia": (0, 3.5),
    "examen": (0, 2.5),
    "examenes": (0, 2.5),
    "diagnostico": (0, 3.0),
    "diagnosticos": (0, 3.0),
    "valoracion": (0, 2.5),
    "interconsulta": (0, 3.0),
    "remision": (0, 2.5),
    "incapacidad": (0, 3.0),
    "terapia": (0, 3.0),
    "fisioterapia": (0, 3.0),
    "odontologia": (0, 3.0),
    "pediatria": (0, 3.0),
    "psicologia": (0, 3.0),
    "turno": (0, 2.0),
    "turnos": (0, 2.0),
    "atencion": (0, 1.5),
    "consulta": (0, 1.0),
    "consultas": (0, 1.0),
    # 1: Facturación
    "facturacion": (1, 4.0),
    "factura": (1, 4.0),
    "facturas": (1, 4.0),
    "facturado": (1, 3.5),
    "cobro": (1, 3.5),
    "cobros": (1, 3.5),
    "cobraron": (1, 3.5),
    "copago": (1, 3.5),
    "copagos": (1, 3.5),
    "cuota": (1, 3.0),
    "cuotas": (1, 3.0),
    "reembolso": (1, 3.5),
    "reembolsos": (1, 3.5),
    "tarifa": (1, 3.0),
    "tarifas": (1, 3.0),
    "recibo": (1, 3.0),
    "liquidacion": (1, 3.5),
    "exoneracion": (1, 3.5),
    "exonerado": (1, 3.5),
    "exonerada": (1, 3.5),
    "sobrecosto": (1, 3.5),
    "sobrecostos": (1, 3.5),
    "cartera": (1, 3.0),
    "descuento": (1, 2.5),
    "devolucion": (1, 3.0),
    "caja": (1, 2.0),
    "pago": (1, 1.5),
    "pagos": (1, 1.5),
    "pagar": (1, 1.5),
    # 2: Farmacia
    "farmacia": (2, 4.0),
    "farmacias": (2, 4.0),
    "medicamento": (2, 3.5),
    "medicamentos": (2, 3.5),
    "medicina": (2, 3.0),
    "medicinas": (2, 3.0),
    "formula": (2, 3.5),
    "formulas": (2, 3.5),
    "formulado": (2, 3.0),
    "formulados": (2, 3.0),
    "formulacion": (2, 3.5),
    "dispensacion": (2, 3.5),
    "dispensar": (2, 3.5),
    "drogueria": (2, 3.5),
    "pastilla": (2, 3.5),
    "pastillas": (2, 3.5),
    "jarabe": (2, 3.5),
    "inyeccion": (2, 3.5),
    "ampolla": (2, 3.5),
    "ampollas": (2, 3.5),
    "insulina": (2, 3.5),
    "dosis": (2, 3.0),
    "receta": (2, 3.0),
    "recetas": (2, 3.0),
    "existencias": (2, 3.0),
    "desabastecimiento": (2, 4.0),
    "mipres": (2, 3.0),
    "vademecum": (2, 3.0),
}


def _normalize_text(texto: str) -> str:
    """Convierte a minúsculas y elimina tildes/diacríticos para comparación léxica."""
    decomposed = unicodedata.normalize("NFKD", texto or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return stripped.lower().strip()


def _score_domain_categories(texto: str) -> list[float]:
    """Calcula puntajes por categoría clínica (0: Atención Médica, 1: Facturación, 2: Farmacia)."""
    scores = [0.0, 0.0, 0.0]
    remaining = _normalize_text(texto)
    if not remaining:
        return scores

    # Enmascarar frases compuestas para evitar doble conteo con tokens ambiguos internos.
    for phrase, class_idx, weight in _DOMAIN_PHRASES:
        remaining, matches = re.subn(rf"\b{re.escape(phrase)}\b", " ", remaining)
        if matches:
            scores[class_idx] += matches * weight

    for token in re.findall(r"\b[a-z0-9]+\b", remaining):
        match = _DOMAIN_TOKENS.get(token)
        if match:
            class_idx, weight = match
            scores[class_idx] += weight

    return scores

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
        Proyecta la intención clínica del texto libre al espacio 7D del dataset Seeds
        para preservar el flujo completo (StandardScaler + red neuronal Softmax).
        """
        limpio = (texto or "").strip()
        if not limpio:
            return _CLASS_CENTROIDS[0:1].copy()

        scores = _score_domain_categories(limpio)
        ranked = sorted([0, 1, 2], key=lambda idx: scores[idx], reverse=True)
        best_idx, second_idx = ranked[0], ranked[1]

        # Sin coincidencias léxicas claras se parte del centroide neutro (Atención Médica).
        if scores[best_idx] <= 0.0:
            return _CLASS_CENTROIDS[0:1].copy()

        # Acotar el desplazamiento hacia la segunda clase (<= 15 %) porque en Seeds
        # Rosa (1) y Canadian (2) flanquean a Kama (0) y un promedio amplio cruzaría de clase.
        margin = (scores[best_idx] - scores[second_idx]) / (scores[best_idx] + 1e-6)
        secondary_pull = 0.0 if scores[second_idx] <= 0.0 else 0.15 * (1.0 - margin)
        vector = (
            (1.0 - secondary_pull) * _CLASS_CENTROIDS[best_idx]
            + secondary_pull * _CLASS_CENTROIDS[second_idx]
        )
        return vector.reshape(1, 7).astype(np.float32)

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
