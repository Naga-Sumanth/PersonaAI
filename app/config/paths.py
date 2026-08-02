"""
Path utility configuration for PersonaAI.
Resolves and exposes all folder and file paths dynamically and relatively.
"""

import os
from pathlib import Path

# Resolve base directory (project root: parent of app/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Helper to resolve environment paths safely
def resolve_env_path(var_name: str, default_path: Path) -> Path:
    val = os.environ.get(var_name)
    if val:
        path = Path(val)
        if path.exists():
            return path
    return default_path

# Target directories under project root or app
UPLOAD_DIR = resolve_env_path("PERSONAAI_UPLOAD_DIR", BASE_DIR / "uploads")
STATIC_DIR = BASE_DIR / "app" / "static"
CONFIG_FILE = BASE_DIR / "config.json"

def ensure_directories() -> None:
    """Ensure that uploads and other required directories exist."""
    directories = [
        UPLOAD_DIR
    ]
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
