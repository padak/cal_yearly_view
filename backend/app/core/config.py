from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    PROJECT_NAME: str = "Year Calendar View"
    API_V1_STR: str = "/api/v1"
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/callback"
    GOOGLE_AUTH_SCOPES: list = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly",
    ]
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:5174"]
    SECRET_KEY: str

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings() 