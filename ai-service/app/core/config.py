import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "MiPQR AI Classification Service"
    APP_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    MODEL_PATH: str = Field(default="models/modelo.h5")
    SCALER_PATH: str = Field(default="models/escalador.pkl")
    METADATA_PATH: str = Field(default="models/metadata.json")

    def get_absolute_path(self, relative_path: str) -> str:
        if os.path.isabs(relative_path):
            return relative_path
        return os.path.normpath(os.path.join(self.BASE_DIR, relative_path))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
