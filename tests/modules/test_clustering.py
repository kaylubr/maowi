from types import SimpleNamespace

import pytest

from server.modules import clustering


def test_build_preview_truncates_to_1500_words():
    preview = clustering.build_preview(" ".join(f"word{index}" for index in range(2000)))

    words = preview.split()
    assert len(words) == 1500
    assert words[0] == "word0"
    assert words[-1] == "word1499"


def test_build_preview_normalizes_whitespace():
    assert clustering.build_preview("  spaced   out\n\ntext  ") == "spaced out text"


def test_build_prompt_includes_modules_and_files():
    modules = [SimpleNamespace(id=1, name="Cell Biology")]
    files = [SimpleNamespace(id=7, parsed_text="mitochondria are organelles")]

    prompt = clustering.build_prompt(modules, files)

    assert '"id": "1"' in prompt
    assert "Cell Biology" in prompt
    assert '"file_id": "7"' in prompt
    assert "mitochondria are organelles" in prompt
    assert "No markdown fences" in prompt
    assert "Output schema" in prompt


def test_cluster_files_returns_assignments(monkeypatch):
    monkeypatch.setattr(
        clustering,
        "generate_json",
        lambda prompt: {"assignments": [{"file_id": "7", "new_module_name": "Cells"}]},
    )

    assignments = clustering.cluster_files([], [SimpleNamespace(id=7, parsed_text="x")])

    assert assignments == [{"file_id": "7", "new_module_name": "Cells"}]


@pytest.mark.parametrize(
    "response",
    [{}, {"assignments": None}, {"assignments": "not-a-list"}],
)
def test_cluster_files_tolerates_malformed_response(monkeypatch, response):
    monkeypatch.setattr(clustering, "generate_json", lambda prompt: response)

    assert clustering.cluster_files([], []) == []
