from fastapi import APIRouter, HTTPException, status
from app.schemas.predict import PredictionRequest, PredictionResponse, HealthResponse
from app.services.inference import inference_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Salud"])
def health_check():
    return HealthResponse(
        status="ok" if inference_service.is_ready() else "degraded",
        modelo_cargado=inference_service.model is not None,
        escalador_cargado=inference_service.scaler is not None,
        version=inference_service.version
    )

@router.post("/predict", response_model=PredictionResponse, tags=["Inferencia"])
def predict_pqr(payload: PredictionRequest):
    try:
        if not payload.texto and not payload.features:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe suministrar el campo 'texto' o 'features' con 7 valores para clasificar la solicitud."
            )
        return inference_service.predict(features=payload.features, texto=payload.texto)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante el procesamiento de inferencia: {str(e)}"
        )
