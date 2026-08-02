from fastapi import APIRouter, HTTPException
from app.prompts.prompt_builder import PromptBuilder
from app.services.ai_provider import generate_response
from app.api.upload import load_profile_context
from app.config.config import load_settings
from app.utils.logger import logger

router = APIRouter()

@router.post("/career-advice")
def get_career_advice():
    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    if not consolidated_text:
        raise HTTPException(status_code=400, detail="Please upload your profile context files first.")
        
    settings = load_settings()
    prompt = PromptBuilder.build_career_prompt(consolidated_text)
    
    try:
        system_instructions = "You are a professional career coach and development advisor. Be concise and well-structured - do not let any section run so long that later sections get cut off."
        # This report has 3 required sections (roles, roadmap, skill gaps).
        # A generous floor stops it being truncated mid-sentence.
        response = generate_response(system_instructions, prompt, settings, min_tokens=2048)
        return {"advice": response}
    except Exception as e:
        logger.error(f"Error generating career advice: {e}")
        raise HTTPException(status_code=502, detail=str(e))
