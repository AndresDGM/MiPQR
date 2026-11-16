from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

class PredictionRequest(BaseModel):
    texto: Optional[str] = Field(
        default=None,
        description="Texto descriptivo o asunto de la solicitud PQR a clasificar",
        max_length=5000
    )
    features: Optional[List[float]] = Field(
        default=None,
        description="Vector opcional con las 7 variables numéricas de entrada para el modelo"
    )

    @field_validator("features")
    def validate_features_length(cls, v):
        if v is not None and len(v) != 7:
            raise ValueError("El vector de características debe contener exactamente 7 valores numéricos.")
        return v

class PredictionResponse(BaseModel):
    categoria_predicha: str = Field(description="Nombre de la categoría recomendada para la PQR")
    indice_clase: int = Field(description="Índice de la clase ganadora predicha por argmax (0, 1, 2)")
    confianza: float = Field(description="Probabilidad softmax asociada a la clase seleccionada [0.0 - 1.0]")
    clase_modelo_original: str = Field(description="Nombre de la clase original en el dataset de entrenamiento")
    probabilidades: List[float] = Field(description="Distribución completa de probabilidades calculada por la capa Softmax")
    version_modelo: str = Field(description="Identificador o versión del modelo neuronal")
    metodo_inferencia: str = Field(description="Método de procesamiento empleado (ej. features_directas o adaptacion_texto)")

class HealthResponse(BaseModel):
    status: str
    modelo_cargado: bool
    escalador_cargado: bool
    version: str
