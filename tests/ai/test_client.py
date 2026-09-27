from types import SimpleNamespace

from server.ai import client as ai_client


def test_generate_json_parses_response(monkeypatch):
    captured = {}

    def fake_generate_content(model, contents, config):
        captured["model"] = model
        captured["contents"] = contents
        captured["config"] = config
        return SimpleNamespace(text='{"assignments": [{"file_id": "1"}]}')

    fake_client = SimpleNamespace(
        models=SimpleNamespace(generate_content=fake_generate_content)
    )
    monkeypatch.setattr(ai_client, "get_client", lambda: fake_client)

    result = ai_client.generate_json("hello")

    assert result == {"assignments": [{"file_id": "1"}]}
    assert captured["model"] == "gemini-3.5-flash-lite"
    assert captured["contents"] == "hello"
    assert captured["config"].response_mime_type == "application/json"
