import os
import sys

print("Verifying PersonaAI app imports...")
try:
    from app.utils.logger import logger
    from app.config.config import load_settings
    from app.rag.parser import parse_file
    from app.prompts.prompt_builder import PromptBuilder
    from app.guardrails.guardrails import check_input_guardrails
    from app.services.ai_provider import generate_response
    print("✅ All services and utils imported successfully!")
except Exception as e:
    print(f"❌ Verification failed during import: {e}")
    sys.exit(1)

# Ensure folder structures exist
print("Verifying directories...")
paths = [
    "app",
    "app/api",
    "app/config",
    "app/guardrails",
    "app/prompts",
    "app/rag",
    "app/services",
    "app/utils",
    "app/static/css",
    "app/static/components",
    "app/static/pages",
    "app/config/paths.py",
    "app/config/settings.py",
    "app/config/.env",
    "uploads"
]

missing = False
for p in paths:
    full_p = os.path.join(os.path.dirname(__file__), p)
    if os.path.exists(full_p):
        print(f"✅ Directory exists: {p}")
    else:
        print(f"❌ Missing directory: {p}")
        missing = True

if missing:
    sys.exit(1)

print("\n🎉 Verification Complete! PersonaAI project matches all structural specs.")
sys.exit(0)


