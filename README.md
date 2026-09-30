<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/ui/public/maowi.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/maowi-on-light.svg">
    <img alt="Maowi" src="docs/assets/maowi-on-light.svg" height="70">
  </picture>
</p>

<p align="center">
  <img alt="Python 3.12" src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white">
  <img alt="SQLAlchemy" src="https://img.shields.io/badge/SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white">
  <img alt="Alembic" src="https://img.shields.io/badge/Alembic-6BA81E">
  <img alt="Groq" src="https://img.shields.io/badge/Groq-F55036">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white">
  <img alt="Bootstrap" src="https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white">
</p>

Maowi turns your lecture notes into practice questions. You add a module by naming it and attaching up to five lecture files, then it writes a set of questions from them.

- **Flashcard**: read the question, guess, then check yourself. Nothing is scored.
- **Multiple Choice**: four options, one is correct. The run is scored.
- **Identification**: type the answer from memory. The run is scored.

Modules can be shared with friends through an invite link, and each one has its own leaderboard. Your files are read in memory and then thrown away, so nothing is stored.

## Setup

You need:

- Python 3.12 or newer
- [uv](https://docs.astral.sh/uv/)
- Node.js 20 or newer with npm
- Docker, for the local PostgreSQL container
- A Groq API key
- A Google OAuth client ID

### 1. Clone the repo

```sh
git clone https://github.com/kaylubr/maowi.git
cd maowi
```

### 2. Start the database

```sh
docker compose up -d
```

### 3. Install the backend

```sh
uv sync
cp .env.example .env
```

Now open `.env` and fill in:

- `GROQ_API_KEY` with your Groq API key
- `JWT_SECRET_KEY` with any long random string
- `GOOGLE_CLIENT_ID` with your Google OAuth client ID

The default `DATABASE_URL` already points at the Docker database.

Then apply the migrations:

```sh
uv run alembic upgrade head
```

### 4. Install the frontend

```sh
npm --prefix src/ui install
cp src/ui/.env.example src/ui/.env
```

The defaults point the UI at `http://localhost:8000`, which is where the backend runs.

### 5. Run the dev servers

Start the backend and the frontend together:

```sh
uv run python dev.py
```

Or run them in two terminals:

```sh
uv run fastapi dev src/server/main.py
npm --prefix src/ui run dev
```

The app is at `http://localhost:5173` and the API docs are at `http://localhost:8000/docs`.

## Tests

```sh
uv run pytest
npm --prefix src/ui test
```
