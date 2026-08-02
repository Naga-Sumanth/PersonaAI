import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.prompts.prompt_builder import PromptBuilder
from app.services.ai_provider import generate_response
from app.api.upload import load_profile_context, UPLOAD_DIR
from app.config.config import load_settings
from app.utils.logger import logger
from app.utils.json_extract import extract_json

router = APIRouter()
CACHE_FILE = os.path.join(UPLOAD_DIR, "cached_resume_summary.json")

class ProjectExplainRequest(BaseModel):
    project_name: str

class AchievementRequest(BaseModel):
    platform: str # LinkedIn Summary, Resume Summary, Bio, Portfolio About, Professional Introduction

class IntroRequest(BaseModel):
    intro_type: str # Technical, HR, General
    duration: str # 30 seconds, 1 minute, Detailed

@router.post("/resume-summary")
def get_resume_summary():
    # 1. Check if cache exists
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                logger.info("Loading resume summary from cache...")
                return json.load(f)
        except Exception as cache_err:
            logger.error(f"Failed to read resume summary cache: {cache_err}")

    # 2. Otherwise generate from LLM
    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    if not consolidated_text:
        raise HTTPException(status_code=400, detail="Please upload your profile context files first.")

    settings = load_settings()
    prompt = PromptBuilder.build_resume_insight_prompt(consolidated_text)

    try:
        system_instructions = "You are an expert talent recruiter. Extract insights from the candidate's profile context. Output ONLY valid JSON, with no markdown formatting and no commentary before or after the JSON object."
        # This is a data-dense structured response (skills, projects, strengths,
        # weaknesses, summary, roles) - give it a generous floor so it isn't
        # truncated regardless of the global max_tokens setting.
        raw_output = generate_response(system_instructions, prompt, settings, min_tokens=2048)

        try:
            data = extract_json(raw_output)
        except ValueError as json_err:
            logger.error(f"Failed to parse resume insight JSON: {raw_output}. Error: {json_err}")
            raise HTTPException(status_code=502, detail="The AI provider returned a response that could not be parsed. Please try again.")

        # Defensive defaults so the frontend never breaks on a missing key.
        data.setdefault("skills", [])
        data.setdefault("projects", [])
        data.setdefault("strengths", [])
        data.setdefault("weaknesses", [])
        data.setdefault("experience_summary", "")
        data.setdefault("suggested_roles", [])

        # 3. Save to cache
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
                logger.info("Saved resume summary to cache.")
        except Exception as cache_write_err:
            logger.error(f"Failed to write resume summary cache: {cache_write_err}")

        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting resume insights: {e}")
        raise HTTPException(status_code=502, detail=str(e))

@router.post("/project-explainer")
def explain_project(request: ProjectExplainRequest):
    project_name = request.project_name.strip()
    if not project_name:
        raise HTTPException(status_code=400, detail="Project name cannot be empty.")

    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    if not consolidated_text:
        raise HTTPException(status_code=400, detail="Please upload your profile context files first.")

    settings = load_settings()
    prompt = PromptBuilder.build_project_prompt(consolidated_text, project_name)

    try:
        system_instructions = "You are an experienced technical solutions architect. Answer strictly in JSON format according to the schema provided."
        raw_output = generate_response(system_instructions, prompt, settings, min_tokens=2048)
        
        try:
            data = extract_json(raw_output)
            return data
        except ValueError as json_err:
            logger.error(f"Failed to parse Project Explainer JSON: {raw_output}. Error: {json_err}")
            raise HTTPException(
                status_code=502,
                detail=f"Failed to parse AI response into structured JSON. Error: {str(json_err)}"
            )
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error detailing project {project_name}: {e}")
        raise HTTPException(status_code=502, detail=str(e))

@router.post("/achievement")
def generate_achievements(request: AchievementRequest):
    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    if not consolidated_text:
        raise HTTPException(status_code=400, detail="Please upload your profile context files first.")

    settings = load_settings()
    prompt = PromptBuilder.build_achievement_prompt(consolidated_text, request.platform)

    try:
        system_instructions = "You are a professional brand advisor and resume writer. Strictly follow the formatting rules given for the requested platform - each platform has a distinct structure and tone."
        response = generate_response(system_instructions, prompt, settings, min_tokens=1024)
        return {"generated_text": response}
    except Exception as e:
        logger.error(f"Error generating branding: {e}")
        raise HTTPException(status_code=502, detail=str(e))

@router.post("/self-introduction")
def generate_introduction(request: IntroRequest):
    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    if not consolidated_text:
        raise HTTPException(status_code=400, detail="Please upload your profile context files first.")

    settings = load_settings()
    prompt = PromptBuilder.build_introduction_prompt(consolidated_text, request.intro_type, request.duration)

    try:
        system_instructions = "You are the candidate's digital representative delivering a personalized elevator pitch."
        response = generate_response(system_instructions, prompt, settings, min_tokens=768)
        return {"introduction": response}
    except Exception as e:
        logger.error(f"Error generating introduction: {e}")
        raise HTTPException(status_code=502, detail=str(e))
