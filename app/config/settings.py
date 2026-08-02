"""
Application configurations loaded from environment variables and .env file.
Uses pydantic-settings for robust environment loading.
"""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = 8080
    app_env: str = "development"
    log_level: str = "INFO"
    
    # Theme configuration
    theme: str = "dark"
    
    # AI Connection & API keys
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openrouter_api_key: str = ""
    huggingface_api_key: str = ""
    model_name: str = "mistralai/Mistral-7B-Instruct-v0.3"
    
    ai_provider: str = "gemini"  # gemini, groq, openrouter, huggingface
    temperature: float = 0.7
    max_tokens: int = 1024

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
