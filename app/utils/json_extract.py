import json
import re
from app.utils.logger import logger


def extract_json(raw_text: str) -> dict:
    """
    Robustly extract a JSON object from an LLM's raw text response.

    Models frequently wrap JSON in markdown code fences, add a leading/
    trailing sentence, or add trailing commentary even when explicitly told
    to return "only JSON". This tries several strategies before giving up,
    which meaningfully improves reliability of the Profile Insights /
    Interview Evaluation features that depend on structured output.
    """
    if not raw_text:
        raise ValueError("Empty response received from AI provider.")

    text = raw_text.strip()

    # Strategy 1: direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 2: strip markdown code fences (```json ... ``` or ``` ... ```)
    fence_match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fence_match:
        candidate = fence_match.group(1).strip()
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            pass

    # Strategy 3: grab the first balanced {...} block in the text, in case the
    # model added a leading/trailing sentence around the JSON.
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            pass

    logger.error(f"Failed to extract JSON from AI response: {raw_text[:500]}")
    raise ValueError("The AI response could not be parsed as valid JSON.")
