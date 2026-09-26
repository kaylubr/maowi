from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str
    jwt_secret_key: str
    jwt_expire_minutes: int = 10080
    max_files_per_upload: int = 5
    cookie_secure: bool = False
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
