from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.routes import api_router
from app.backend.routes.cached_analysis import router as cached_analysis_router

app = FastAPI(title="AI Hedge Fund API", description="Backend API for AI Hedge Fund", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(api_router)
app.include_router(cached_analysis_router)

# Import scheduler functions
from app.backend.services.scheduled_tasks import start_scheduler, shutdown_scheduler

@app.on_event("startup")
async def on_startup():
    """Run on application startup."""
    await start_scheduler()

@app.on_event("shutdown")
async def on_shutdown():
    """Run on application shutdown."""
    await shutdown_scheduler()
