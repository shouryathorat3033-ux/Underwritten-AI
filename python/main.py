from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routes.chat import router as chat_router
from routes.suggestions import router as suggestions_router
from routes.scoring import router as scoring_router
from routes.weights import router as weights_router
from routes.rag import router as rag_router
from routes.forensics import router as forensics_router
from routes.fraud import router as fraud_router
from routes.training import router as training_router
from config.settings import PORT

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app = FastAPI(title="UnderwriteAI Chat Backend")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

import os
_cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://underwriting-five.vercel.app",
]
# Allow custom frontend URL via env (for Render↔Vercel connection)
_extra_origin = os.getenv("FRONTEND_URL")
if _extra_origin:
    _cors_origins.append(_extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler — ensures CORS headers are present even on 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": f"Internal server error: {str(exc)}"},
    )

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(suggestions_router, prefix="/api/chat", tags=["suggestions"])
app.include_router(scoring_router, prefix="/api/ml/score", tags=["ml"])
app.include_router(weights_router, prefix="/api/ml/weights", tags=["weights"])
app.include_router(rag_router, prefix="/api/rag", tags=["rag"])
app.include_router(forensics_router, prefix="/api/verify", tags=["forensics"])
app.include_router(fraud_router, prefix="/api/fraud", tags=["fraud"])
app.include_router(training_router, prefix="/api/ml/train", tags=["training"])


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    is_dev = os.getenv("RENDER") is None  # Render sets RENDER=true in production
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=is_dev, log_level="info", access_log=True)
