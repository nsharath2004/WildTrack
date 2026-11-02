import os
import hmac
import hashlib
import json
import base64
import time
from functools import wraps
from flask import request, jsonify, g
from config import Config

# Standard JWT Header: {"alg": "HS256", "typ": "JWT"}
_JWT_HEADER_B64 = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode('utf-8')).decode('utf-8').rstrip('=')

def _b64_encode(data_bytes):
    return base64.urlsafe_b64encode(data_bytes).decode('utf-8').rstrip('=')

def _b64_decode(data_str):
    padding = '=' * ((4 - len(data_str) % 4) % 4)
    return base64.urlsafe_b64decode((data_str + padding).encode('utf-8'))

def generate_jwt(payload, expires_in_seconds=None):
    """Generate a cryptographically signed HMAC-SHA256 JWT string."""
    if expires_in_seconds is None:
        expires_in_seconds = Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS * 3600
    
    body = dict(payload)
    body['iat'] = int(time.time())
    body['exp'] = int(time.time() + expires_in_seconds)

    payload_json = json.dumps(body, separators=(',', ':')).encode('utf-8')
    payload_b64 = _b64_encode(payload_json)

    signing_input = f"{_JWT_HEADER_B64}.{payload_b64}".encode('utf-8')
    secret = Config.SECRET_KEY.encode('utf-8')
    signature = hmac.new(secret, signing_input, hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)

    return f"{_JWT_HEADER_B64}.{payload_b64}.{sig_b64}"

def verify_jwt(token):
    """Verify HMAC signature and expiration of JWT, returning decoded payload or None."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts

        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        secret = Config.SECRET_KEY.encode('utf-8')
        expected_sig = hmac.new(secret, signing_input, hashlib.sha256).digest()

        if not hmac.compare_digest(_b64_decode(sig_b64), expected_sig):
            return None

        payload_bytes = _b64_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        # Verify expiration
        if 'exp' in payload and payload['exp'] < int(time.time()):
            return None

        return payload
    except Exception:
        return None

def token_required(f):
    """Decorator requiring a valid JWT Bearer token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()

        if not token:
            return jsonify({'error': 'Authentication token is required in Authorization header (Bearer <token>)'}), 401

        payload = verify_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired authentication token. Please log in again.'}), 401

        g.current_user = payload
        return f(*args, **kwargs)
    return decorated

def roles_required(*allowed_roles):
    """Decorator enforcing Role-Based Access Control (Admin, Researcher, Forest Officer)."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            token = None
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1].strip()

            if not token:
                return jsonify({'error': 'Authentication token is required.'}), 401

            payload = verify_jwt(token)
            if not payload:
                return jsonify({'error': 'Invalid or expired token.'}), 401

            user_role = payload.get('role', '')
            # Normalization check
            if user_role not in allowed_roles and 'Admin' not in [user_role]:
                return jsonify({
                    'error': f'Access Forbidden: Your role ({user_role}) does not have permission to perform this action. Required roles: {", ".join(allowed_roles)}'
                }), 403

            g.current_user = payload
            return f(*args, **kwargs)
        return decorated
    return decorator
