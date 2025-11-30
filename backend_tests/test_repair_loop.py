from fastapi.testclient import TestClient
from app.server import app


def test_repair_loops_until_fixed(monkeypatch, tmp_path):
    responses = iter([
        "Try running it like this...",
        "print('ok')"   # success on 2nd attempt
    ])

    # Patch LLM call
    monkeypatch.setattr("app.server.call_llm",
                        lambda *a: next(responses))

    # Patch run_python to fail twice, succeed on third
    run_results = iter([
        (1, "", "error"),   # attempt 1 fail
        (0, "ok", "")       # attempt 2 success
    ])

    monkeypatch.setattr("app.server.run_python",
                        lambda *a: next(run_results))

    # ---- Create fake run directory ----
    import uuid
    run_id = uuid.uuid4().hex

    fake_repairs_dir = tmp_path / "repairs"
    fake_repairs_dir.mkdir()

    run_dir = fake_repairs_dir / run_id
    run_dir.mkdir()
    (run_dir / "test.py").write_text("broken")

    # Patch WORKDIR
    monkeypatch.setattr("app.server.WORKDIR", str(fake_repairs_dir))

    client = TestClient(app)

    resp = client.post(f"/repair/{run_id}", json={"language": "python"})

    assert resp.json()["iterations"] == 1