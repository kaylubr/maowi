from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.config import settings

app = FastAPI(title="Maowi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
