from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router
from app.services.inference import inference_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Carga única de artefactos de Machine Learning durante el arranque
    try:
        inference_service.load_artifacts()
    except Exception as e:
        print(f"[ALERTA CRÍTICA] Fallo al precargar artefactos de IA: {e}")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Microservicio de inferencia neuronal para clasificación automática de PQR en MiPQR (Clínica Dolormed)",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
