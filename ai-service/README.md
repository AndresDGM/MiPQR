# Microservicio de Inferencia de Inteligencia Artificial - MiPQR

Microservicio distribuido en **Python (FastAPI)** que expone el modelo neuronal multicapa entrenado con **TensorFlow/Keras** para la clasificación y sugerencia automática de categorías de PQR en la plataforma MiPQR (Clínica Dolormed).

---

## 1. Arquitectura y Tecnologías
- **Framework Web:** FastAPI (asíncrono, validación con Pydantic).
- **Servidor ASGI:** Uvicorn.
- **Deep Learning:** TensorFlow 2 / Keras (Perceptrón Multicapa con 2 capas ocultas ReLU y salida Softmax).
- **Preprocesamiento:** `StandardScaler` ajustado en entrenamiento y recuperado mediante `joblib`.
- **Interpretación:** Decodificación multiclase con `np.argmax`.

---

## 2. Ejecución Local

### Prerrequisitos
- Python 3.11 instalado.
- Gestor `uv` o `pip`.

### Pasos
```bash
cd ai-service

# 1. Crear y activar entorno virtual
uv venv .venv --python 3.11
source .venv/bin/activate

# 2. Instalar dependencias
uv pip install -r requirements.txt

# 3. Iniciar el servicio
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 3. Endpoints Disponibles

### `GET /health`
Verifica la disponibilidad y el estado de precarga del modelo y del escalador.
**Respuesta:**
```json
{
  "status": "ok",
  "modelo_cargado": true,
  "escalador_cargado": true,
  "version": "1.0.0"
}
```

### `POST /predict`
Clasifica una PQR a partir de su texto descriptivo o de un vector de 7 características numéricas.
**Ejemplo de Petición:**
```json
{
  "texto": "Llevo 5 días esperando la entrega del medicamento autorizado en farmacia."
}
```
**Ejemplo de Respuesta:**
```json
{
  "categoria_predicha": "Farmacia",
  "indice_clase": 2,
  "confianza": 0.9412,
  "clase_modelo_original": "Canadian",
  "probabilidades": [0.0321, 0.0267, 0.9412],
  "version_modelo": "1.0.0",
  "metodo_inferencia": "adaptacion_texto"
}
```

---

## 4. Ejecución de Pruebas
```bash
pytest tests/ -v
```
