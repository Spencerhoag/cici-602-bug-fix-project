from fastapi import FastAPI, UploadFile, File, HTTPException
import subprocess, uuid, os, shutil, json, tempfile
from pydantic import BaseModel
from typing import Optional
import re
from pathlib import Path
from llm_client import call_llm

# Eddie imports
from fastapi.responses import PlainTextResponse
from supabase import create_client, Client



app = FastAPI()

WORKDIR = "/repairs"

@app.get("/getitbruh")
def nowgetit() -> str:
    #print("hi")
    return "Wassup"

class RepairRequest(BaseModel):
    expected_output: Optional[str] = None
    language: str  # python or java


def run_python(run_id, filename):
    # path inside API container
    container_path = f"/repairs/{run_id}/{filename}"

    # creates unique name for the runner container
    runner_name = f"python_runner_{uuid.uuid4().hex[:8]}"

    print("RUNNER NAME:", runner_name)
    print("CONTAINER PATH TO COPY:", container_path)

    try:
        # 1. runner container params (but do not run yet)
        subprocess.run(
            ["docker", "create", "--name", runner_name,
             "python-runner", "python", filename],
            check=True
        )

        # 2. Copy user file from API container into runner container
        subprocess.run(
            ["docker", "cp",
             container_path,
             f"{runner_name}:/work/{filename}"],
            check=True
        )

        # 3. Start the container, capture output
        proc = subprocess.run(
            ["docker", "start", "-a", runner_name],
            capture_output=True, text=True
        )

        return proc.returncode, proc.stdout, proc.stderr

    finally:
        # 4. remove the runner container after execution
        subprocess.run(["docker", "rm", "-f", runner_name])


def run_java(run_id, filename):
    # Path to user code inside the API container
    container_path = f"/repairs/{run_id}/{filename}"

    # create a unique runner container name
    runner_name = f"java_runner_{uuid.uuid4().hex[:8]}"

    print("JAVA RUNNER NAME:", runner_name)
    print("CONTAINER PATH TO COPY:", container_path)

    try:
        # 1. create the Java runner container (but do not run it yet)
        subprocess.run(
            ["docker", "create", "--name", runner_name,
             "java-runner", "sh", "-c",
             f"javac {filename} && java {filename.replace('.java','')}"],
            check=True
        )

        # 2. Copy the user's Java file from API container into runner
        subprocess.run(
            ["docker", "cp",
             container_path,
             f"{runner_name}:/work/{filename}"],
            check=True
        )

        # 3. Start the container and capture output
        proc = subprocess.run(
            ["docker", "start", "-a", runner_name],
            capture_output=True, text=True
        )

        return proc.returncode, proc.stdout, proc.stderr

    finally:
        # 4. Clean up runner container
        subprocess.run(["docker", "rm", "-f", runner_name])


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

    with (open(dest_path, "wb") as f):
        f.write(await file.read())

        # Proof of concept

        # You can find the below in "Project Settings" and then "Data API"
        # towards the top.
        Dburl: str = "https://jbsqfajyjowjclrpifqh.supabase.co"
        # You can find the below in "Project Settings" and then "API Keys"
        Dbkey: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impic3FmYWp5am93amNscnBpZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Nzk4NjIsImV4cCI6MjA3ODA1NTg2Mn0.OBMv1oJp7qqFbZn8gxA_Ov7ue2xN6YYa-m2rLrDrmyc"
        # I don't know how to read the contents of a file as a string, so
        # I have a stand in below
        fileContents: str = "print(\"Bruh\")"
        ourDb: Client = create_client(Dburl, Dbkey)
        # The below should add a new row to the Db. This needs to be changed.
        ourDb.table("SupabaseAPIExperiments").insert({"directoryName": run_id, "fileContents": fileContents}).execute()

    return {"run_id": run_id, "filename": filename}


@app.post("/repair/{run_id}")
async def repair(run_id: str, req: RepairRequest):

    run_dir = os.path.join(WORKDIR, run_id)

    files = os.listdir(run_dir)

    if not files:
        raise HTTPException(404, "No file in run directory")
    ##########################################return "here we are again again once again of course"
    filename = files[0]

    for iteration in range(3):
        # 1. RUN USER CODE
        if req.language == "python":
            ret, out, err = run_python(run_id, filename)  # starts python-runner container
            print("RUN OUTPUT:\n", out, "ERR:\n", err, ret)
        else:
            ret, out, err = run_java(run_id, filename)  # starts java-runner container

        # 2. CHECK FOR SUCCESS - exit code == 0 and expected output matches or not provided
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

        # 5. Call LLM
        raw = call_llm(prompt)
        print("LLM RAW OUTPUT:\n", raw)  # for debugging

        # Extract only the code from LLM response
        new_code = extract_code_only(raw)
        print("CLEANED CODE:\n", new_code)

        # overwrite user's file
        with open(source_path, "w") as f:
            f.write(new_code)

            # Proof of concept

            # You can find the below in "Project Settings" and then "Data API"
            # towards the top.
            Dburl : str = "https://jbsqfajyjowjclrpifqh.supabase.co"
            # You can find the below in "Project Settings" and then "API Keys"
            Dbkey : str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impic3FmYWp5am93amNscnBpZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Nzk4NjIsImV4cCI6MjA3ODA1NTg2Mn0.OBMv1oJp7qqFbZn8gxA_Ov7ue2xN6YYa-m2rLrDrmyc"
            ourDb : Client = create_client(Dburl, Dbkey)
            # The below line SHOULD update the db row for the file with the new text/code
            ourDb.table("SupabaseAPIExperiments").update({"fileContents": new_code}).eq("directoryName", run_id).execute()

    return {"status": "failed", "error": "Max iterations reached"}
