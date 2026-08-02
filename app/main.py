import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config.config import load_settings, save_settings, AppSettings
from app.config.settings import settings
from app.utils.logger import logger

# Import routes
from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.api.interview import router as interview_router
from app.api.resume import router as resume_router
from app.api.career import router as career_router

app = FastAPI(
    title="PersonaAI Backend API",
    description="Backend services for PersonaAI - Your AI-Powered Digital Twin",
    version="1.0.0"
)

# Settings config endpoints
@app.get("/api/settings")
def get_current_settings():
    try:
        return load_settings()
    except Exception as e:
        logger.error(f"Failed to read settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to load app configurations.")

@app.post("/api/settings")
def update_settings(settings: AppSettings):

    if settings.ai_provider == "gemini" and not settings.gemini_api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API Key is required."
        )

    if settings.ai_provider == "groq" and not settings.groq_api_key:
        raise HTTPException(
            status_code=400,
            detail="Groq API Key is required."
        )

    if settings.ai_provider == "openrouter" and not settings.openrouter_api_key:
        raise HTTPException(
            status_code=400,
            detail="OpenRouter API Key is required."
        )

    if settings.ai_provider == "huggingface" and not settings.huggingface_api_key:
        raise HTTPException(
            status_code=400,
            detail="HuggingFace API Key is required."
        )

    try:
        save_settings(settings)
        return {
            "status": "success",
            "message": "Settings saved successfully."
        }

    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to write app configurations."
        )

# Include sub-routers under api prefix
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(interview_router, prefix="/api", tags=["Interview"])
app.include_router(resume_router, prefix="/api", tags=["Resume"])
app.include_router(career_router, prefix="/api", tags=["Career"])

# Serve frontend views and static assets
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

@app.get("/")
def read_root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Index HTML not found.")

@app.get("/{page_name}.html")
def read_page(page_name: str):
    page_path = os.path.join(FRONTEND_DIR, "pages", f"{page_name}.html")
    if os.path.exists(page_path):
        return FileResponse(page_path)
    raise HTTPException(status_code=404, detail=f"Page {page_name}.html not found.")

# Mount the frontend folder for asset loading (style.css, script.js)
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

if __name__ == "__main__":
    logger.info("Starting PersonaAI Application Server...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.port, reload=True)


