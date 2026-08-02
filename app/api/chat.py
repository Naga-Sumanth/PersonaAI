from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.guardrails.guardrails import check_input_guardrails, verify_output_guardrails
from app.prompts.prompt_builder import PromptBuilder
from app.services.ai_provider import generate_response
from app.api.upload import load_profile_context
from app.config.config import load_settings
from app.utils.logger import logger

router = APIRouter()

class ChatMessage(BaseModel):
    role: str # user, assistant
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/chat")
def chat_with_twin(request: ChatRequest):
    # 1. Guardrails check on user prompt
    violation_response = check_input_guardrails(request.message)
    if violation_response:
        return {"response": violation_response, "guardrail_triggered": True}
        
    # 2. Get profile context
    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    
    if not consolidated_text:
        return {"response": "I couldn't find this information in your uploaded documents. Please upload your profile first.", "guardrail_triggered": False}
        
    # 3. Load App Settings (API Keys, provider, model parameters)
    settings = load_settings()
    
    # 4. Construct System Prompt
    system_prompt = PromptBuilder.build_system_prompt(consolidated_text)
    
    # Format conversational history into the main prompt to Gemini
    history_context = ""
    if request.history:
        for msg in request.history[-5:]: # Use last 5 messages for memory context
            history_context += f"{msg.role.capitalize()}: {msg.content}\n"
            
    full_prompt = f"{history_context}User: {request.message}\nAssistant:"
    
    # 5. Call LLM Provider
    try:
        raw_response = generate_response(system_prompt, full_prompt, settings, min_tokens=512)
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        raise HTTPException(status_code=502, detail=str(e))
        
    # 6. Guardrails check on LLM response
    final_response = verify_output_guardrails(raw_response)
    
    return {"response": final_response, "guardrail_triggered": False}
