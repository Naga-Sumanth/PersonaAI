import os
import json
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.logger import logger
from app.rag.parser import parse_file

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

CONTEXT_FILE = os.path.join(UPLOAD_DIR, "profile_context.json")

def load_profile_context() -> dict:
    if os.path.exists(CONTEXT_FILE):
        try:
            with open(CONTEXT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading context file: {e}")
    return {"files": {}, "consolidated_text": ""}

def save_profile_context(context: dict):
    # Consolidate text from all files
    all_texts = []
    for file_info in context.get("files", {}).values():
        all_texts.append(f"--- File: {file_info.get('filename')} ---\n{file_info.get('content')}")
    
    context["consolidated_text"] = "\n\n".join(all_texts)
    
    with open(CONTEXT_FILE, "w", encoding="utf-8") as f:
        json.dump(context, f, indent=4, ensure_ascii=False)

def invalidate_resume_cache():
    cache_path = os.path.join(UPLOAD_DIR, "cached_resume_summary.json")
    if os.path.exists(cache_path):
        try:
            os.remove(cache_path)
            logger.info("Cleared resume summary cache due to file changes.")
        except Exception as e:
            logger.error(f"Failed to clear resume summary cache: {e}")

@router.post("/upload")
async def upload_profile_file(file: UploadFile = File(...)):
    # Save the file to UPLOAD_DIR
    target_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(target_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        logger.error(f"Failed to save file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Parse the file content
    try:
        parsed_text = parse_file(target_path)
    except Exception as e:
        if os.path.exists(target_path):
            os.remove(target_path)
        logger.error(f"Failed to parse file {file.filename}: {e}")
        raise HTTPException(status_code=400, detail=f"Parsing error: {str(e)}")
        
    # Update context registry
    context = load_profile_context()
    context["files"][file.filename] = {
        "filename": file.filename,
        "size": os.path.getsize(target_path),
        "content": parsed_text
    }
    save_profile_context(context)
    invalidate_resume_cache()
    
    return {
        "status": "success",
        "message": f"Successfully parsed and uploaded {file.filename}",
        "file": {
            "filename": file.filename,
            "size": os.path.getsize(target_path)
        }
    }

@router.get("/profile")
def get_profile():
    context = load_profile_context()
    file_list = []
    for filename, info in context.get("files", {}).items():
        file_list.append({
            "filename": filename,
            "size": info.get("size", 0),
            "preview": info.get("content", "")
        })
    return {
        "files": file_list,
        "has_profile": len(file_list) > 0,
        "consolidated_length": len(context.get("consolidated_text", ""))
    }

@router.delete("/uploads")
def clear_uploads():
    context = load_profile_context()
    
    # Delete actual physical files
    for filename in context.get("files", {}).keys():
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.error(f"Failed to delete {file_path}: {e}")
                
    # Remove context file itself
    if os.path.exists(CONTEXT_FILE):
        try:
            os.remove(CONTEXT_FILE)
        except Exception as e:
            logger.error(f"Failed to delete context file: {e}")
            
    invalidate_resume_cache()
    return {"status": "success", "message": "All uploaded documents and profiles have been cleared."}

@router.delete("/upload/{filename}")
def delete_file(filename: str):
    context = load_profile_context()
    if filename not in context.get("files", {}):
        raise HTTPException(status_code=404, detail="File not found in registry")
        
    # Delete physically
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.error(f"Failed to delete file {filename}: {e}")
            
    # Delete from registry
    del context["files"][filename]
    save_profile_context(context)
    invalidate_resume_cache()
    return {"status": "success", "message": f"Successfully deleted {filename}"}
