FROM node:26-slim AS ui-build
WORKDIR /ui
COPY src/ui/package*.json ./
RUN npm ci
COPY src/ui/ ./
ARG GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
RUN npm run build

FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY src/server ./src/server
COPY --from=ui-build /ui/dist ./static

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH=/app/src \
    STATIC_DIR=/app/static
    
EXPOSE 8000
CMD ["uvicorn", "src.server.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]