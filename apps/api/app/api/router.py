from fastapi import APIRouter

from app.api.routes import auth, email_sending, email_templates, job_search_runs, linkedin_browser_collector, opportunities, user_settings

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(opportunities.router)
api_router.include_router(job_search_runs.router)
api_router.include_router(linkedin_browser_collector.router)
api_router.include_router(user_settings.router)
api_router.include_router(email_templates.router)
api_router.include_router(email_sending.router)


@api_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
