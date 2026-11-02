import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Safe .env loader that always reads latest values
env_file = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_file):
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip().strip("'\"")
    except Exception:
        pass

def _resolve_chroma_path():
    raw_path = os.getenv('CHROMA_PERSIST_DIRECTORY', '')
    if not raw_path:
        return os.path.join(PROJECT_ROOT, 'vector_database', 'chroma_data')
    if os.path.isabs(raw_path):
        return raw_path
    # Clean leading relative prefixes like ../ or ./
    clean = raw_path.replace('../', '').replace('..\\', '').replace('./', '').replace('.\\', '')
    return os.path.join(PROJECT_ROOT, clean)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'pesu-wildtrack-jwt-secret-key-2026-production')
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'Mysql@123')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'wildlife_management')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 12))
    CHROMA_PERSIST_DIRECTORY = _resolve_chroma_path()
