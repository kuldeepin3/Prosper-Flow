import hmac
import hashlib
import base64
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

import logging

logger = logging.getLogger(__name__)

DEFAULT_SECRET = "antigravity-super-secret-key-12345!!!"
JWT_SECRET = os.getenv("JWT_SECRET", DEFAULT_SECRET)
JWT_ALGORITHM = "HS256"

if JWT_SECRET == DEFAULT_SECRET:
    logger.warning(
        "WARNING: Using the default insecure JWT_SECRET. "
        "Please set a secure JWT_SECRET environment variable in production."
    )

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + key.hex()

def verify_password(password: str, hashed: str) -> bool:
    try:
        salt_hex, key_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False

def base64url_encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).replace(b'=', b'').decode('utf-8')

def base64url_decode(payload: str) -> bytes:
    padding = '=' * (4 - (len(payload) % 4))
    return base64.urlsafe_b64decode(payload + padding)

def create_access_token(data: dict, expires_delta_seconds: int = 86400) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_delta_seconds
    
    header_encoded = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_encoded = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_base = f"{header_encoded}.{payload_encoded}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_base, hashlib.sha256).digest()
    signature_encoded = base64url_encode(signature)
    
    return f"{header_encoded}.{payload_encoded}.{signature_encoded}"

def decode_token(token: str) -> dict:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_encoded, payload_encoded, signature_encoded = parts
        
        signature_base = f"{header_encoded}.{payload_encoded}".encode('utf-8')
        expected_signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_base, hashlib.sha256).digest()
        expected_signature_encoded = base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_encoded.encode('utf-8'), expected_signature_encoded.encode('utf-8')):
            return None
            
        payload = json.loads(base64url_decode(payload_encoded).decode('utf-8'))
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None
