import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from server.attempts.router import router as attempts_router
from server.auth.router import router as auth_router
from server.dashboard.router import router as dashboard_router
from server.members.router import router as members_router
from server.modules.router import router as modules_router
from server.modules.tasks import sweep_orphaned_creations
from server.questions.router import router as questions_router
from server.users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    sweep_orphaned_creations()
    yield


app = FastAPI(title="Maowi API", lifespan=lifespan)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(modules_router)
app.include_router(questions_router)
app.include_router(attempts_router)
app.include_router(dashboard_router)
app.include_router(members_router)

if os.getenv("STATIC_DIR"):
    static = Path(os.environ["STATIC_DIR"]).resolve()
    app.mount("/assets", StaticFiles(directory=static / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404)
        f = (static / path).resolve()
        if path and f.is_file() and f.is_relative_to(static):
            return FileResponse(f)
        return FileResponse(static / "index.html")