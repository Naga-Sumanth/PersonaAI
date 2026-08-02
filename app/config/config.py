import os
import json
from pydantic import BaseModel
from app.config.paths import CONFIG_FILE
from app.config.settings import settings as env_settings
from app.utils.logger import logger

class AppSettings(BaseModel):
    theme: str = "dark"
    ai_provider: str = "gemini"  # gemini, groq, openrouter, huggingface
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openrouter_api_key: str = ""
    huggingface_api_key: str = ""
    model_name: str = "mistralai/Mistral-7B-Instruct-v0.3"
    temperature: float = 0.7
    max_tokens: int = 1024

def load_settings() -> AppSettings:
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                data = json.load(f)
                return AppSettings(**data)
        except Exception as e:
            logger.error(f"Failed to load config.json: {e}")
    # Fallback to env variables (loaded via settings.py)
    return AppSettings(
        theme=env_settings.theme,
        ai_provider=env_settings.ai_provider,
        gemini_api_key=env_settings.gemini_api_key,
        groq_api_key=env_settings.groq_api_key,
        openrouter_api_key=env_settings.openrouter_api_key,
        huggingface_api_key=env_settings.huggingface_api_key,
        model_name=env_settings.model_name,
        temperature=env_settings.temperature,
        max_tokens=env_settings.max_tokens
    )

def save_settings(settings: AppSettings):
    with open(CONFIG_FILE, "w") as f:
        json.dump(settings.model_dump(), f, indent=4)

