# import os
# from fastapi.testclient import TestClient
# from app.server import app

# def test_upload_and_repair(monkeypatch, tmp_path):
#     # 1️⃣ Create temp /repairs directory
#     repairs_dir = tmp_path / "repairs"
#     repairs_dir.mkdir(parents=True, exist_ok=True)

#     # 2️⃣ Patch WORKDIR before creating TestClient
#     monkeypatch.setattr("app.server.WORKDIR", str(repairs_dir))

#     # 3️⃣ Patch run_python so Docker never runs
#     def fake_run_python(run_id, entry):
#         return 0, "OK", ""

#     monkeypatch.setattr("app.server.run_python", fake_run_python)

#     # 4️⃣ Patch LLM to return fixed code
#     monkeypatch.setattr("app.llm_client.call_llm",
#                         lambda *a: "print('fixed code')")

#     # 5️⃣ Create TestClient AFTER patching
#     client = TestClient(app)

#     # 6️⃣ Upload a single file
#     resp = client.post("/upload", files={"file": ("test.py", b"print('broken')")})
#     assert resp.status_code == 200, resp.text

#     run_id = resp.json()["run_id"]

#     # 7️⃣ Repair
#     resp = client.post("/repair", json={
#         "run_id": run_id,
#         "language": "python"
#     })

#     assert resp.status_code == 200, resp.text
#     assert "fixed" in resp.json()["repaired_code"]