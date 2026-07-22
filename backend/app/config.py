"""Application configuration.

Settings are read from environment variables (and an optional .env file),
so nothing environment-specific is hardcoded in the app.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Portfolio Manager API"
    version: str = "0.1.0"

    # Everything the API exposes lives under this prefix so we can version it.
    api_prefix: str = "/api/v1"

    # Origins allowed to call the API from a browser (the Next.js dev server).
    cors_origins: list[str] = ["http://localhost:3000"]

    # MySQL connection string, e.g. mysql+pymysql://user:password@localhost:3306/portfolio
    database_url: str = "mysql+pymysql://root:password@localhost:3306/portfolio"


settings = Settings()
