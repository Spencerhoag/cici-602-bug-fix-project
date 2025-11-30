from app.server import run_python
import uuid
from unittest.mock import patch

def test_run_python_success(monkeypatch):
    run_id = uuid.uuid4().hex
    filename = "test.py"

    # 1️⃣ Mock os.path.exists to pretend the file exists
    monkeypatch.setattr("os.path.exists", lambda path: True)

    # 2️⃣ Mock subprocess.run to simulate container creation, copy, and start
    class DummyResult:
        def __init__(self, returncode=0, stdout="hello world", stderr=""):
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = stderr

    def fake_subprocess_run(*args, **kwargs):
        return DummyResult()

    monkeypatch.setattr("subprocess.run", fake_subprocess_run)

    # 3️⃣ Call run_python — no actual Docker run occurs
    ret, out, err = run_python(run_id, filename)

    assert ret == 0
    assert "hello world" in out
    assert err == ""