from functools import lru_cache
from typing import Annotated
from urllib.parse import quote

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

class Settings(BaseSettings):
    APP_ENV: str = Field(default="development", validation_alias=AliasChoices("ENVIRONMENT", "APP_ENV"))
    APP_NAME: str = "Campus Hustle API"
    DEBUG: bool | None = None
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = Field(validation_alias=AliasChoices("SUPABASE_DATABASE_URL", "DATABASE_URL"))

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_USER: str = "default"
    REDIS_PASSWORD: str | None = None
    REDIS_URL: str = ""

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default=["http://localhost:5173"],
        validation_alias=AliasChoices("ALLOWED_ORIGINS", "CORS_ORIGINS"),
    )
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1"]

    RATE_LIMIT_ENABLED: bool = True
    LOGIN_RATE_LIMIT: int = 5
    LOGIN_RATE_WINDOW_SECONDS: int = 60
    REGISTER_RATE_LIMIT: int = 3
    REGISTER_RATE_WINDOW_SECONDS: int = 300

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    @field_validator("SECRET_KEY")
    @classmethod
    def strong_secret(cls, v: str):
        if len(v.encode()) < 32:
            raise ValueError("SECRET_KEY must be at least 32 bytes")
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode="after")
    def build_redis_url(self):
        if not self.REDIS_URL:
            host = self.REDIS_HOST
            scheme = "redis" if host in ("localhost", "127.0.0.1", "::1") else "rediss"
            auth = ""
            if self.REDIS_PASSWORD:
                auth = f"{quote(self.REDIS_USER or 'default', safe='')}:{quote(self.REDIS_PASSWORD, safe='')}@"
            self.REDIS_URL = f"{scheme}://{auth}{host}:{self.REDIS_PORT}"
        return self

    @model_validator(mode="after")
    def derive_debug(self):
        if self.DEBUG is None:
            self.DEBUG = self.APP_ENV.strip().lower() != "production"
        return self

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
