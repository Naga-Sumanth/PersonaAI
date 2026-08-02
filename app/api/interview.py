from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.prompts.prompt_builder import PromptBuilder
from app.services.ai_provider import generate_response
from app.api.upload import load_profile_context
from app.config.config import load_settings
from app.utils.logger import logger
from app.utils.json_extract import extract_json

router = APIRouter()

# In-memory session database for active interviews
# Key: session_id, Value: list of QA dicts
interview_sessions = {}

class InterviewStartRequest(BaseModel):
    category: str # HR, Technical, Manager
    session_id: str

class InterviewAnswerRequest(BaseModel):
    session_id: str
    category: str
    answer: str

@router.post("/interview/start")
def start_interview(request: InterviewStartRequest):
    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    if not consolidated_text:
        raise HTTPException(status_code=400, detail="Please upload your profile context files before starting the interview.")
        
    settings = load_settings()
    
    # Reset or initialize session history
    interview_sessions[request.session_id] = []
    
    # Generate first question
    prompt = PromptBuilder.build_interview_prompt(
        context=consolidated_text,
        category=request.category,
        phase="generate_question",
        history=[]
    )
    
    try:
        system_instructions = "You are a professional hiring manager. Generate a challenging interview question for the candidate."
        question = generate_response(system_instructions, prompt, settings, min_tokens=256)
        
        # Save question to memory
        interview_sessions[request.session_id].append({
            "question": question,
            "answer": ""
        })
        
        return {"question": question, "session_id": request.session_id}
    except Exception as e:
        logger.error(f"Failed to generate first question: {e}")
        raise HTTPException(status_code=500, detail=f"Interview agent error: {str(e)}")

@router.post("/interview/answer")
def process_answer(request: InterviewAnswerRequest):
    session_id = request.session_id
    if session_id not in interview_sessions or not interview_sessions[session_id]:
        raise HTTPException(status_code=400, detail="Active interview session not found. Please start a new interview.")
        
    context = load_profile_context()
    consolidated_text = context.get("consolidated_text", "").strip()
    settings = load_settings()
    
    history = interview_sessions[session_id]
    # Update the last entry with user's answer
    history[-1]["answer"] = request.answer
    
    # Build evaluation prompt
    eval_prompt = PromptBuilder.build_interview_prompt(
        context=consolidated_text,
        category=request.category,
        phase="evaluate",
        history=history,
        last_answer=request.answer
    )
    
    try:
        system_instructions = "You are a professional hiring manager evaluating a candidate's answer. Output ONLY a valid JSON object, with no markdown formatting and no commentary before or after the JSON."
        eval_output = generate_response(system_instructions, eval_prompt, settings, min_tokens=512)

        # Parse JSON (robust to markdown fences / stray commentary)
        try:
            evaluation = extract_json(eval_output)
            evaluation.setdefault("feedback", "Answer analyzed.")
            evaluation.setdefault("suggestions", [])
            evaluation.setdefault("score", 70)
        except ValueError as json_err:
            logger.error(f"Failed to parse evaluation JSON from: {eval_output}. Error: {json_err}")
            evaluation = {
                "feedback": "Answer analyzed. Excellent try.",
                "suggestions": ["Elaborate more on technical details.", "Include real project scenarios."],
                "score": 75
            }
            
        # If the session is under 5 questions, generate next question
        next_question = None
        if len(history) < 5:
            next_prompt = PromptBuilder.build_interview_prompt(
                context=consolidated_text,
                category=request.category,
                phase="generate_question",
                history=history
            )
            next_instructions = "You are a hiring manager. Generate the next follow-up or category question based on context and history."
            next_question = generate_response(next_instructions, next_prompt, settings, min_tokens=256)
            
            # Store next question in session
            interview_sessions[session_id].append({
                "question": next_question,
                "answer": ""
            })
            
        return {
            "evaluation": evaluation,
            "next_question": next_question,
            "completed": next_question is None,
            "progress": len(history)
        }
    except Exception as e:
        logger.error(f"Failed to process answer and evaluate: {e}")
        raise HTTPException(status_code=500, detail=str(e))
