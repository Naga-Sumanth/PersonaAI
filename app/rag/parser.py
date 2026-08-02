import os
import json
import docx
import fitz  # PyMuPDF
from rapidocr_onnxruntime import RapidOCR
from app.utils.logger import logger

_ocr_engine = None

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        try:
            _ocr_engine = RapidOCR()
        except Exception as e:
            logger.error(f"Failed to initialize RapidOCR: {e}")
            raise ValueError(f"Failed to initialize OCR engine: {str(e)}")
    return _ocr_engine

def extract_text_from_image(file_path: str) -> str:
    try:
        engine = get_ocr_engine()
        result, elapse = engine(file_path)
        if not result:
            return ""
        
        lines = []
        for line in result:
            if len(line) >= 2 and line[1]:
                lines.append(line[1])
        return "\n".join(lines).strip()
    except Exception as e:
        logger.error(f"Error executing OCR on image {file_path}: {e}")
        raise ValueError(f"OCR failed for image: {str(e)}")

def extract_text_from_pdf(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        
        text = text.strip()
        
        # Trigger OCR fallback if the digital text extracted is negligible (e.g. scanned doc)
        if len(text) < 50:
            logger.info(f"PDF {file_path} standard text extraction length is short ({len(text)} chars). Triggering OCR fallback...")
            ocr_text = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                pix = page.get_pixmap(dpi=150)
                png_bytes = pix.tobytes("png")
                
                engine = get_ocr_engine()
                result, elapse = engine(png_bytes)
                if result:
                    for line in result:
                        if len(line) >= 2 and line[1]:
                            ocr_text.append(line[1])
            text = "\n".join(ocr_text).strip()
            
        return text
    except Exception as e:
        logger.error(f"Error parsing PDF file {file_path}: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        text = []
        for paragraph in doc.paragraphs:
            if paragraph.text:
                text.append(paragraph.text)
        return "\n".join(text).strip()
    except Exception as e:
        logger.error(f"Error parsing DOCX file {file_path}: {e}")
        raise ValueError(f"Failed to parse DOCX: {str(e)}")

def extract_text_from_json(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return json.dumps(data, indent=2)
    except Exception as e:
        logger.error(f"Error parsing JSON file {file_path}: {e}")
        raise ValueError(f"Failed to parse JSON: {str(e)}")

def extract_text_from_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    except Exception as e:
        logger.error(f"Error parsing TXT file {file_path}: {e}")
        raise ValueError(f"Failed to parse text file: {str(e)}")

def parse_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".json":
        return extract_text_from_json(file_path)
    elif ext in [".txt", ".md"]:
        return extract_text_from_txt(file_path)
    elif ext in [".png", ".jpg", ".jpeg"]:
        return extract_text_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
