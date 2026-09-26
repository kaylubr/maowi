# Memory

## Project Overview
See @README.md for project overview and @pyproject.toml (backend) / @src/ui/package.json (frontend) for available commands.

An AI-powered study app: users upload lecture files (PDF/DOCX/PPTX), the backend parses them to text, an AI clustering step groups files into topic-based modules, and an AI generation step produces a shared pool of questions per module (prompt/answer/distractors). The frontend reformats that pool into three modes — Flashcard (unscored), Multiple Choice, and Identification (exact-match, case-insensitive) — and MCQ/Identification runs are logged as scored attempts.

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
- Backend is grouped by domain (`auth/`, `users/`, `files/`, `modules/`, `questions/`, `attempts/`, `ai/`), each with its own `router.py`, `schemas.py`, `models.py`, `service.py` — domains don't share files
- DB session/engine setup lives only in `src/server/db/` — nothing else defines an engine or session
- All Gemini calls go through `src/server/ai/client.py` — never call the SDK directly from elsewhere
- Auth cookie is HttpOnly + `SameSite=Strict`, no CSRF token
- Questions are a single shared pool per module — mode (flashcard/mcq/identification) is a display/scoring concern, not a stored type. Flashcard is unscored; MCQ and Identification are scored via `attempts` / `attempt_answers`
- File uploads capped at 5 per batch, enforced server-side before parsing

## Common Workflows
- **Commit immediately after finishing each feature, before starting the next one.** Never let two features sit uncommitted together. If a feature is only partially done, commit what works before moving forward — don't carry unfinished work into the next task.
- New DB model or model change → update the domain's `models.py` → `uv run alembic revision --autogenerate -m "<description>"` → review the migration before applying it
- Local dev: `docker compose up -d` for Postgres, `uv run fastapi dev src/server/main.py` for the API