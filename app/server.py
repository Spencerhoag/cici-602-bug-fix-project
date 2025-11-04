from fastapi import FastAPI, UploadFile, File, HTTPException
import subprocess, uuid, os, shutil, json, tempfile
from pydantic import BaseModel
from typing import Optional
import re
from llm_client import call_llm


app = FastAPI()

WORKDIR = "/repairs"


def host_path_from_container_path(path: str) -> str:
    # container: /repairs/<run_id>
    # host: ./repair_data/<run_id>
    return path.replace("/repairs", "./repair_data")



class RepairRequest(BaseModel):
    expected_output: Optional[str] = None
    language: str  # python or java


def run_python(run_dir, filename):
    print("CONTAINER RUN_DIR:", run_dir)
    host_dir = host_path_from_container_path(run_dir)
    print("HOST_DIR BEING MOUNTED:", host_dir)
    cmd = [
        "docker", "run", "--rm",
        "--network", "none",
        "--memory=512m",
        "--cpus=0.5",
        "-v", f"{host_dir}:/work:ro",
        "-w", "/work",
        "python-runner",  # built from python.Dockerfile
        "python", filename
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    return proc.returncode, proc.stdout, proc.stderr


def run_java(run_dir, filename):
    cmd = [
        "docker", "run", "--rm",
        "--network", "none",
        "--memory=512m",
        "--cpus=0.5",
        "-v", f"{run_dir}:/work:ro",
        "-w", "/work",
        "java-runner-image",  # built from java.Dockerfile
        "bash", "-c", f"javac {filename} && java {filename[:-5]}"
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    return proc.returncode, proc.stdout, proc.stderr


def extract_code_only(text: str) -> str:
    """
    Extracts ONLY the code from an LLM response.
    Handles:
    - Markdown code fences
    - Explanations before/after
    - Extra lines
    - Incorrect preambles
    """
    # If LLM gives fenced code like ```python ... ```
    fenced = re.findall(r"```(?:python)?\s*(.*?)```", text, re.S)
    if fenced:
        return fenced[0].strip()
    
    # Otherwise: remove any lines that are clearly explanation
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        if line.strip().startswith("Here is"):
            continue
        if line.strip().startswith("The given"):
            continue
        if line.strip().startswith("The code"):
            continue
        if line.strip().startswith("Corrected"):
            continue
        if line.strip().startswith("Fix"):
            continue
        cleaned.append(line)

    return "\n".join(cleaned).strip()


@app.post("/upload")
async def upload(file: UploadFile = File(...), language: str = "python"):
    run_id = uuid.uuid4().hex
    run_dir = os.path.join(WORKDIR, run_id)
    os.makedirs(run_dir, exist_ok=True)

    filename = file.filename
    dest_path = os.path.join(run_dir, filename)

    with open(dest_path, "wb") as f:
        f.write(await file.read())

    return {"run_id": run_id, "filename": filename}


@app.post("/repair/{run_id}")
async def repair(run_id: str, req: RepairRequest):
    run_dir = os.path.join(WORKDIR, run_id)

    files = os.listdir(run_dir)
    if not files:
        raise HTTPException(404, "No file in run directory")

    filename = files[0]

    for iteration in range(3):
        # 1. RUN USER CODE
        if req.language == "python":
            ret, out, err = run_python(run_dir, filename)
            print("RUN OUTPUT:\n", out, "ERR:\n", err, ret)
        else:
            ret, out, err = run_java(run_dir, filename)

        # 2. CHECK FOR SUCCESS
        if ret == 0:
            if req.expected_output is None or out.strip() == req.expected_output.strip():
                return {
                    "status": "success",
                    "iterations": iteration + 1,
                    "output": out,
                }

        # 3. LOAD SOURCE
        source_path = os.path.join(run_dir, filename)
        with open(source_path) as f:
            src = f.read()

        # 4. BUILD LLM PROMPT
        prompt = f"""
You are a code auto-repair tool.

RULES:
- You MUST return only valid {req.language} code.
- NO explanations.
- NO comments.
- NO markdown.
- NO backticks.
- NO extra text before or after the code.
- NO additional imports or files.
- NO modifying functionality unless needed.
- ONLY fix the error shown in STDERR or EXIT CODE.
- KEEP THE ORIGINAL STRUCTURE unless strictly necessary.

INPUT FILE NAME: {filename}

CURRENT CODE:
{src}

STDERR:
{err}

EXIT CODE:
{ret}

EXPECTED OUTPUT:
{req.expected_output}

RETURN ONLY THE FULL FIXED CODE BELOW NOTHING ELSE:
"""

        raw = call_llm(prompt)
        print("LLM RAW OUTPUT:\n", raw)

        new_code = extract_code_only(raw)
        print("CLEANED CODE:\n", new_code)

        # overwrite file
        with open(source_path, "w") as f:
            f.write(new_code)

    return {"status": "failed", "error": "Max iterations reached"}
