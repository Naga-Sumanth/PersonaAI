import requests
from app.config.config import AppSettings
from app.utils.logger import logger

# Current Gemini REST API lives under the v1beta surface, not v1 - the v1
# endpoint 404s for the flash models. Primary + fallback model chain in case
# the primary alias is renamed/retired on Google's side in the future.
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]


def _effective_settings(settings: AppSettings, min_tokens: int | None) -> AppSettings:
    """Return a copy of settings with max_tokens bumped up to at least
    min_tokens, without touching the user's saved configuration. This lets
    long-form report endpoints (career advice, resume insights, etc.) avoid
    truncation even if the global Settings page slider is set low for quick
    chat replies."""
    if min_tokens and settings.max_tokens < min_tokens:
        return settings.model_copy(update={"max_tokens": min_tokens})
    return settings


def query_gemini(system_prompt: str, prompt: str, settings: AppSettings) -> str:
    if not settings.gemini_api_key:
        raise ValueError("Google Gemini API Key is missing. Please add it in settings.")

    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature": settings.temperature,
            "maxOutputTokens": settings.max_tokens
        }
    }

    last_error = None
    for model in GEMINI_MODEL_CHAIN:
        url = f"{GEMINI_API_BASE}/{model}:generateContent?key={settings.gemini_api_key}"
        logger.info(f"Querying Gemini API (model={model})...")
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
        except requests.RequestException as e:
            last_error = f"Network error contacting Gemini API: {e}"
            logger.error(last_error)
            continue

        if response.status_code == 404:
            # Model alias not available for this API key/version - try the next one.
            logger.warning(f"Gemini model '{model}' not found (404). Trying next fallback model...")
            last_error = f"Gemini API returned error code 404: {response.text}"
            continue

        if response.status_code != 200:
            logger.error(f"Gemini API failure: {response.text}")
            raise RuntimeError(f"Gemini API returned error code {response.status_code}: {response.text}")

        res_data = response.json()
        try:
            candidates = res_data.get("candidates") or []
            if not candidates:
                # Often means the response was blocked by safety filters or ran
                # out of tokens before producing any content.
                finish_reason = res_data.get("promptFeedback", {}).get("blockReason", "UNKNOWN")
                raise RuntimeError(f"Gemini returned no candidates (reason: {finish_reason}).")
            text = candidates[0]["content"]["parts"][0]["text"]
            return text
        except (KeyError, IndexError) as e:
            logger.error(f"Failed to parse Gemini response: {res_data}. Error: {e}")
            raise RuntimeError("Invalid response structure received from Gemini API.")

    raise RuntimeError(last_error or "Gemini API request failed for all known model names.")


def query_groq(system_prompt: str, prompt: str, settings: AppSettings) -> str:
    if not settings.groq_api_key:
        raise ValueError("Groq API Key is missing. Please add it in settings.")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens
    }

    logger.info("Querying Groq API...")
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        logger.error(f"Groq API failure: {response.text}")
        raise RuntimeError(f"Groq API returned error: {response.text}")

    res_data = response.json()
    return res_data["choices"][0]["message"]["content"]


def query_openrouter(system_prompt: str, prompt: str, settings: AppSettings) -> str:
    if not settings.openrouter_api_key:
        raise ValueError("OpenRouter API Key is missing. Please add it in settings.")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens
    }

    logger.info("Querying OpenRouter API...")
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        logger.error(f"OpenRouter API failure: {response.text}")
        raise RuntimeError(f"OpenRouter API returned error: {response.text}")

    res_data = response.json()
    return res_data["choices"][0]["message"]["content"]


def query_huggingface(system_prompt: str, prompt: str, settings: AppSettings) -> str:
    if not settings.huggingface_api_key:
        raise ValueError("HuggingFace API Key is missing. Please add it in settings.")

    url = f"https://api-inference.huggingface.co/models/{settings.model_name}"
    headers = {
        "Authorization": f"Bearer {settings.huggingface_api_key}",
        "Content-Type": "application/json"
    }

    formatted_prompt = f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n{prompt} [/INST]"
    payload = {
        "inputs": formatted_prompt,
        "parameters": {
            "temperature": max(settings.temperature, 0.01),
            "max_new_tokens": settings.max_tokens
        }
    }

    logger.info("Querying HuggingFace API...")
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        logger.error(f"HuggingFace API failure: {response.text}")
        raise RuntimeError(f"HuggingFace API returned error: {response.text}")

    res_data = response.json()

    if isinstance(res_data, list) and len(res_data) > 0:
        gen_text = res_data[0].get("generated_text", "")
        if gen_text.startswith(formatted_prompt):
            gen_text = gen_text[len(formatted_prompt):]
        return gen_text.strip()
    elif isinstance(res_data, dict) and "generated_text" in res_data:
        return res_data["generated_text"].strip()

    raise RuntimeError("Unexpected response structure from HuggingFace API.")


def generate_response(system_prompt: str, prompt: str, settings: AppSettings, min_tokens: int | None = None) -> str:
    """
    Route a prompt to the configured AI provider.

    min_tokens: optional floor for max_tokens, used by long-form report
    endpoints (career advice, resume insights, project explainer, etc.) so
    they don't get truncated by a low global max_tokens setting. Does not
    modify the user's saved settings - only affects this single call.
    """
    effective = _effective_settings(settings, min_tokens)
    provider = effective.ai_provider.lower().strip()

    if provider == "gemini":
        return query_gemini(system_prompt, prompt, effective)
    elif provider == "groq":
        return query_groq(system_prompt, prompt, effective)
    elif provider == "openrouter":
        return query_openrouter(system_prompt, prompt, effective)
    elif provider == "huggingface":
        return query_huggingface(system_prompt, prompt, effective)
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")
