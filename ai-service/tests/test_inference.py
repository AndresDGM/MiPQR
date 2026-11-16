import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.inference import inference_service

@pytest.fixture(scope="session", autouse=True)
def init_inference():
    """Precarga los artefactos antes de ejecutar la suite de pruebas."""
    inference_service.load_artifacts()

def test_inference_service_artifacts_loaded():
    assert inference_service.is_ready() is True
    assert inference_service.model is not None
    assert inference_service.scaler is not None

def test_inference_with_direct_features():
    # 7 características numéricas del dataset Seeds
    features = [15.26, 14.84, 0.871, 5.763, 3.312, 2.221, 5.22]
    res = inference_service.predict(features=features)

    assert res.categoria_predicha in ["Atención Médica", "Facturación", "Farmacia"]
    assert res.indice_clase in [0, 1, 2]
    assert 0.0 <= res.confianza <= 1.0
    assert len(res.probabilidades) == 3
    assert res.metodo_inferencia == "features_directas"

def test_inference_with_text():
    texto = "Solicito copia urgente de mi historia clínica completa para médico especialista."
    res = inference_service.predict(texto=texto)

    assert res.categoria_predicha is not None
    assert res.indice_clase in [0, 1, 2]
    assert 0.0 <= res.confianza <= 1.0
    assert len(res.probabilidades) == 3
    assert res.metodo_inferencia == "adaptacion_texto"

def test_api_health():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["modelo_cargado"] is True
    assert data["escalador_cargado"] is True

def test_api_predict_text():
    client = TestClient(app)
    response = client.post("/predict", json={
        "texto": "Cobro indebido de copago en consulta cuando estaba exonerado por tutela."
    })
    assert response.status_code == 200
    data = response.json()
    assert "categoria_predicha" in data
    assert "confianza" in data
    assert "probabilidades" in data
    assert data["indice_clase"] in [0, 1, 2]

def test_api_predict_validation_error():
    client = TestClient(app)
    # Petición sin texto ni features
    response = client.post("/predict", json={})
    assert response.status_code == 400

    # Vector con dimensión incorrecta (debe ser 7)
    response_invalid = client.post("/predict", json={"features": [1.0, 2.0, 3.0]})
    assert response_invalid.status_code == 422
