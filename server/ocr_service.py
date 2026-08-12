import os
import io
import json
import requests
from typing import List, Dict, Any, Optional
from PIL import Image
from pdf2image import convert_from_bytes
import easyocr
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Initialize EasyOCR
# lang="en" for English
try:
    reader = easyocr.Reader(['en'], verbose=False)
except Exception as e:
    logger.error(f"Failed to initialize EasyOCR: {e}")
    reader = None

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "llama3.1" # Using llama3.1 as the primary model

SYSTEM_PROMPT = """You are an invoice extraction engine.
Extract structured information from OCR text.
Return ONLY a valid JSON object matching the following schema exactly:
{
  "MerchantName": "string or null (Name of the merchant or restaurant)",
  "TotalAmount": "number or null (Grand total amount of the transaction as a float, do not include currency symbols)",
  "InvoiceDate": "string or null (Date of the transaction in YYYY-MM-DD format)"
}
Return ONLY the raw JSON object. Do not wrap it in markdown code blocks like ```json ... ```.
No explanations.
Missing fields must be null.
Do not hallucinate."""

def extract_json_from_text(text: str) -> str:
    """Finds and returns the JSON substring within text."""
    if not text:
        return ""
    text = text.strip()
    # Search for standard JSON object structure
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]
    # Search for JSON array structure
    start_arr = text.find('[')
    end_arr = text.rfind(']')
    if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
        return text[start_arr:end_arr+1]
    return text

def process_pdf(file_bytes: bytes) -> List[Image.Image]:
    """Convert a PDF file to a list of PIL Images."""
    try:
        images = convert_from_bytes(file_bytes)
        return images
    except Exception as e:
        logger.error(f"Error converting PDF to images: {e}")
        raise ValueError(f"Failed to process PDF. {e}")

def extract_text_from_image(image: Image.Image) -> str:
    """Extract text from a single PIL image using EasyOCR."""
    if not reader:
        raise RuntimeError("OCR Engine is not initialized.")
        
    # Convert PIL Image to RGB numpy array
    img_array = np.array(image.convert("RGB"))
    
    # Run OCR
    result = reader.readtext(img_array)
    
    extracted_text = []
    for line in result:
        # line[1] contains the text in EasyOCR result
        text = line[1]
        if text and text.strip():
            extracted_text.append(text.strip())
                
    return " ".join(extracted_text)

def run_ocr_pipeline(file_bytes: bytes, filename: str) -> str:
    """Run the OCR pipeline on a file (PDF or Image) and return concatenated text."""
    full_text = ""
    
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    
    if ext == 'pdf':
        images = process_pdf(file_bytes)
        for img in images:
            text = extract_text_from_image(img)
            full_text += text + "\n"
    else:
        # Treat as image
        image = Image.open(io.BytesIO(file_bytes))
        full_text = extract_text_from_image(image)
        
    return full_text.strip()

import ai_service

def parse_with_llm(ocr_text: str) -> Dict[str, Any]:
    """Send OCR text to Ollama to extract structured JSON data."""
    if not ocr_text:
        return {}
        
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"OCR Text:\n{ocr_text}"}
    ]
    
    try:
        # ai_service uses OpenAI client which maps to Ollama
        # We enforce json response formatting in the prompt, Ollama usually respects it.
        # Alternatively we could use client.chat.completions.create(..., response_format={"type": "json_object"})
        # but for simplicity we rely on the system prompt and ai_service.
        content, _ = ai_service.get_llm_response(messages, temperature=0.1)
        
        if content:
            json_str = extract_json_from_text(content)
            return json.loads(json_str)
        return {}
            
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode LLM response as JSON: {e}")
        return {"error": "LLM did not return valid JSON", "raw_text": content}
    except Exception as e:
        logger.error(f"Error communicating with Ollama: {e}")
        raise RuntimeError(f"LLM Parsing failed: {e}")

import ai_service

STATEMENT_PROMPT = """You are an expert financial document parser.
Your task is to analyze the following OCR raw text from a bank statement or transaction list and extract all transaction records into a structured JSON list.

For each transaction, extract:
- date: The date in YYYY-MM-DD format. If year is missing, assume 2026.
- description: The merchant or transaction description.
- amount: The absolute value of the amount (float).
- type: Either "INCOME" (if credit/deposit) or "EXPENSE" (if debit/payment/withdrawal).

Return a valid JSON array of objects. Do not include any other text or explanation. Only return the JSON.
Example output format:
[
  {"date": "2026-07-24", "description": "Starbucks Coffee", "amount": 450.0, "type": "EXPENSE"},
  {"date": "2026-07-25", "description": "Salary Deposit", "amount": 80000.0, "type": "INCOME"}
]
"""

def parse_statement_with_llm(ocr_text: str) -> list:
    if not ocr_text:
        return []
        
    messages = [
        {"role": "system", "content": STATEMENT_PROMPT},
        {"role": "user", "content": f"OCR Text:\n{ocr_text}"}
    ]
    
    try:
        content, _ = ai_service.get_llm_response(messages, temperature=0.1)
        if content:
            json_str = extract_json_from_text(content)
            parsed = json.loads(json_str)
            if isinstance(parsed, list):
                return parsed
        return []
    except Exception as e:
        logger.error(f"Error parsing statement with LLM: {e}")
        return []
