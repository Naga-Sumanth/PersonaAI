import re
from app.utils.logger import logger

HARMFUL_PATTERNS = [
    r"\b(hack|bypass|exploit|malware|virus|crack|jailbreak)\b",
    r"\b(bomb|weapon|kill|suicide|self-harm|murder)\b",
    r"\b(illegal|steal|rob|fraud|cheat|scam)\b"
]

FINANCIAL_MEDICAL_POLITICAL_PATTERNS = [
    r"\b(stock|invest|crypto|bitcoin|financial advice|portfolio advice|mortgage)\b",
    r"\b(diagnose|prescribe|medical advice|cure|symptom|illness|disease|doctor)\b",
    r"\b(democrat|republican|election|vote|president|politics|minister|government)\b",
    r"\b(god|religion|faith|church|bible|quran|prophet|worship)\b"
]

def check_input_guardrails(prompt: str) -> str | None:
    """
    Checks if a prompt violates safety guardrails.
    Returns a rejection message if violated, or None if safe.
    """
    clean_prompt = prompt.lower().strip()
    
    # 1. Check for harmful request / illegal queries
    for pattern in HARMFUL_PATTERNS:
        if re.search(pattern, clean_prompt):
            logger.warning(f"Guardrail violation: Harmful/Illegal content pattern matched in: '{prompt}'")
            return "I cannot assist with requests that are illegal, harmful, or violate safety guidelines."
            
    # 2. Check for out-of-scope advisor queries (Medical, Financial, Political, Religious)
    for pattern in FINANCIAL_MEDICAL_POLITICAL_PATTERNS:
        if re.search(pattern, clean_prompt):
            logger.warning(f"Guardrail violation: Out-of-scope category matched in: '{prompt}'")
            return "I can only answer based on your uploaded profile. I cannot provide medical, financial, political, or religious advice."
            
    # 3. Check for general general-knowledge questions unrelated to twin profile
    # Common questions like "who is", "what is the capital of", "how many people"
    generic_words = [
        "who is prime minister", "who is the president", "capital of", "weather in",
        "current stock price", "latest news", "calculate distance", "what is gravity"
    ]
    for word in generic_words:
        if word in clean_prompt:
            logger.warning(f"Guardrail violation: General knowledge query: '{prompt}'")
            return "I can only answer based on your uploaded profile."
            
    return None

def verify_output_guardrails(response_text: str) -> str:
    """
    Post-processes LLM output to make sure it doesn't hallucinate or violate scoping.
    """
    # If the model itself says it cannot find it, ensure it follows the format.
    lower_res = response_text.lower()
    if "i don't know" in lower_res or "cannot find" in lower_res or "not mentioned" in lower_res or "not specified" in lower_res:
        return "I couldn't find this information in your uploaded documents."
    return response_text
