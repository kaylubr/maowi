import json
from collections.abc import Sequence

from server.ai.client import generate_json
from server.files.models import File
from server.modules.models import Module

PREVIEW_WORDS = 1500

SYSTEM_PROMPT = """You group study materials into topic-based modules for a study app.
Return ONLY valid JSON. No markdown fences, no commentary."""

TASK_INSTRUCTIONS = """For each file, either match it to an existing module_id, or group it
with other new files under a new_module_name (files sharing the exact
same new_module_name string will be grouped together)."""

OUTPUT_SCHEMA = """Output schema:
{"assignments": [
  {"file_id": "f1", "existing_module_id": "m1"},
  {"file_id": "f2", "new_module_name": "Photosynthesis"}
]}"""


def build_preview(parsed_text: str) -> str:
    return " ".join(parsed_text.split()[:PREVIEW_WORDS])


def serialize_modules(modules: Sequence[Module]) -> list[dict]:
    return [{"id": str(module.id), "name": module.name} for module in modules]


def serialize_files(files: Sequence[File]) -> list[dict]:
    return [
        {
            "file_id": str(file.id),
            "preview": build_preview(file.parsed_text or ""),
        }
        for file in files
    ]


def build_prompt(
    existing_modules: Sequence[Module],
    new_files: Sequence[File],
) -> str:
    sections = [
        SYSTEM_PROMPT,
        f"Existing modules:\n{json.dumps(serialize_modules(existing_modules))}",
        f"New files to assign:\n{json.dumps(serialize_files(new_files))}",
        TASK_INSTRUCTIONS,
        OUTPUT_SCHEMA,
    ]
    return "\n\n".join(sections)


def cluster_files(
    existing_modules: Sequence[Module],
    new_files: Sequence[File],
) -> list[dict]:
    response = generate_json(build_prompt(existing_modules, new_files))
    assignments = response.get("assignments")
    if not isinstance(assignments, list):
        return []
    return assignments
