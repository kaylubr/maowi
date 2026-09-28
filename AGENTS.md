# Memory

## Project Overview
See @README.md for project overview and @pyproject.toml (backend) / @src/ui/package.json (frontend) for available commands.

An AI-powered study app: the user adds a module by naming it and attaching lecture files (PDF/DOCX/PPTX) in one step. The backend parses those files in memory, an AI generation step produces a shared pool of questions per module (prompt/answer/distractors), and the module is created only once that succeeds. The frontend reformats the pool into three modes — Flashcard (unscored), Multiple Choice, and Identification (exact-match, case-insensitive) — and MCQ/Identification runs are logged as scored attempts.

## Code Style Guidelines
- Use descriptive variable names
- Follow existing patterns in the codebase
- Do not use comments. Only real devs would use comments
- Extract complex conditions into meaningful boolean variables
- One file, one responsibility, never combine unrelated concerns into a single file because they "look similar"
- Never read environment variables directly (no bare `os.environ` / `os.getenv` outside `src/server/config.py`) — always import the centralized `settings` object
- Keep `main.py` limited to app instantiation, middleware, and router registration — no endpoint logic there

## Architecture Notes
- Backend: FastAPI (`fastapi[standard]`), SQLAlchemy, Alembic, PostgreSQL (Docker Compose locally, Neon in prod)
- Package management: `uv add <package>` / `uv add --dev <package>` only — never hand-edit `pyproject.toml`'s dependency list
- All source lives under `src/`: backend in `src/server/`, frontend in `src/ui/`. `tests/` stays at the project root, outside `src/`
- Backend is grouped by domain (`auth/`, `users/`, `modules/`, `questions/`, `attempts/`, `ai/`), each with its own `router.py`, `schemas.py`, `models.py`, `service.py` — domains don't share files
- DB session/engine setup lives only in `src/server/db/` — nothing else defines an engine or session
- All Gemini calls go through `src/server/ai/client.py` — never call the SDK directly from elsewhere
- Auth cookie is HttpOnly + `SameSite=Strict`, no CSRF token
- Questions are a single shared pool per module — mode (flashcard/mcq/identification) is a display/scoring concern, not a stored type. Flashcard is unscored; MCQ and Identification are scored via `attempts` / `attempt_answers`
- Uploaded files are never persisted — they are parsed in memory during module creation and discarded (parsing lives in `src/server/modules/parsing.py`)
- Module creation is one background job tracked by `module_creations` (`generating`/`ready`/`error`); a module row is only written once its questions generate successfully, so `modules` carries no status of its own
- A module creation takes up to 5 files, enforced server-side before parsing

## Common Workflows
- **Commit immediately after finishing each feature, before starting the next one.** Never let two features sit uncommitted together. If a feature is only partially done, commit what works before moving forward — don't carry unfinished work into the next task.
- New DB model or model change → update the domain's `models.py` → `uv run alembic revision --autogenerate -m "<description>"` → review the migration before applying it
- Local dev: `docker compose up -d` for Postgres, `uv run fastapi dev src/server/main.py` for the API