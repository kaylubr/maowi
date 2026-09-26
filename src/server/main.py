from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.auth.router import router as auth_router
from server.config import settings
from server.users.router import router as users_router

app = FastAPI(title="Maowi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
