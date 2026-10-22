import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/underwriteai")
MONGODB_DB = os.getenv("MONGODB_DB", "test")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
PORT = int(os.getenv("PORT", 8000))
MAX_HISTORY = 10
MAX_MSG_LENGTH = 500
CHAT_TEMP = 0.3
EXTRACT_TEMP = 0.0
MAX_TOKENS = 1024
