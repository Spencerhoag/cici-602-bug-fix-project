from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess, uuid, os, shutil, json, tempfile
from pydantic import BaseModel
from typing import Optional, List, Dict
import re
from pathlib import Path
from llm_client import call_llm
import git


app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKDIR = "/repairs"


class RepairRequest(BaseModel):
    expected_output: Optional[str] = None
    language: str  # python or java


class GitHubCloneRequest(BaseModel):
    url: str
    token: Optional[str] = None


class GitHubFile(BaseModel):
    name: str
    path: str
    content: str
    size: int


class GitHubCloneResponse(BaseModel):
    repo_name: str
    files: List[GitHubFile]
    total_files: int
    detected_language: Optional[str] = None


def run_python(run_id, filename):
    # path inside API container
    container_path = f"/repairs/{run_id}/{filename}"

    # creates unique name for the runner container
    runner_name = f"python_runner_{uuid.uuid4().hex[:8]}"

    print("RUNNER NAME:", runner_name)
    print("CONTAINER PATH TO COPY:", container_path)

    # Verify file exists before attempting to copy
    if not os.path.exists(container_path):
        raise FileNotFoundError(f"Source file not found: {container_path}")

    try:
        # 1. runner container params (but do not run yet)
        create_result = subprocess.run(
            ["docker", "create", "--name", runner_name,
             "python-runner", "python", filename],
            capture_output=True, text=True, check=True
        )
        print(f"Container created: {runner_name}")

        # 2. Copy user file from API container into runner container
        copy_result = subprocess.run(
            ["docker", "cp",
             container_path,
             f"{runner_name}:/work/{filename}"],
            capture_output=True, text=True, check=True
        )
        print(f"File copied successfully to {runner_name}:/work/{filename}")
        if copy_result.stderr:
            print(f"Copy stderr: {copy_result.stderr}")

        # 3. Start the container, capture output
        proc = subprocess.run(
            ["docker", "start", "-a", runner_name],
            capture_output=True, text=True
        )

        return proc.returncode, proc.stdout, proc.stderr

    finally:
        # 4. remove the runner container after execution
        subprocess.run(["docker", "rm", "-f", runner_name], capture_output=True)


def run_java(run_id, filename):
    # Path to user code inside the API container
    container_path = f"/repairs/{run_id}/{filename}"

    # create a unique runner container name
    runner_name = f"java_runner_{uuid.uuid4().hex[:8]}"

    print("JAVA RUNNER NAME:", runner_name)
    print("CONTAINER PATH TO COPY:", container_path)

    # Verify file exists before attempting to copy
    if not os.path.exists(container_path):
        raise FileNotFoundError(f"Source file not found: {container_path}")

    try:
        # 1. create the Java runner container (but do not run it yet)
        create_result = subprocess.run(
            ["docker", "create", "--name", runner_name,
             "java-runner", "sh", "-c",
             f"javac {filename} && java {filename.replace('.java','')}"],
            capture_output=True, text=True, check=True
        )
        print(f"Container created: {runner_name}")

        # 2. Copy the user's Java file from API container into runner
        copy_result = subprocess.run(
            ["docker", "cp",
             container_path,
             f"{runner_name}:/work/{filename}"],
            capture_output=True, text=True, check=True
        )
        print(f"File copied successfully to {runner_name}:/work/{filename}")
        if copy_result.stderr:
            print(f"Copy stderr: {copy_result.stderr}")

        # 3. Start the container and capture output
        proc = subprocess.run(
            ["docker", "start", "-a", runner_name],
            capture_output=True, text=True
        )

        return proc.returncode, proc.stdout, proc.stderr

    finally:
        # 4. Clean up runner container
        subprocess.run(["docker", "rm", "-f", runner_name], capture_output=True)


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


def detect_language_from_files(files: List[Path]) -> Optional[str]:
    """Detect the primary programming language based on file extensions."""
    extension_counts = {}

    for file_path in files:
        ext = file_path.suffix.lower()
        if ext in ['.py', '.java', '.js', '.ts', '.cpp', '.c', '.go', '.rb']:
            extension_counts[ext] = extension_counts.get(ext, 0) + 1

    if not extension_counts:
        return None

    # Map extensions to language names
    ext_to_lang = {
        '.py': 'python',
        '.java': 'java',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.cpp': 'cpp',
        '.c': 'c',
        '.go': 'go',
        '.rb': 'ruby'
    }

    # Get most common extension
    most_common_ext = max(extension_counts, key=extension_counts.get)
    return ext_to_lang.get(most_common_ext)


@app.post("/github-clone", response_model=GitHubCloneResponse)
async def github_clone(request: GitHubCloneRequest):
    """Clone a GitHub repository and return all files with their content."""

    # Validate GitHub URL
    if not request.url.startswith(("https://github.com/", "http://github.com/")):
        raise HTTPException(400, "Invalid GitHub URL. Must start with https://github.com/")

    # Extract repo name from URL
    repo_name = request.url.rstrip('/').split('/')[-1].replace('.git', '')

    # Create temporary directory for cloning
    temp_dir = tempfile.mkdtemp(prefix=f"github_clone_{repo_name}_")

    try:
        # Clone the repository
        print(f"Cloning repository: {request.url}")

        # Build clone URL with token if provided
        clone_url = request.url
        if request.token:
            # Insert token into URL: https://token@github.com/user/repo.git
            clone_url = request.url.replace("https://", f"https://{request.token}@")

        git.Repo.clone_from(clone_url, temp_dir, depth=1)
        print(f"Repository cloned to: {temp_dir}")

        # Walk through the repository and collect files
        files = []
        all_file_paths = []

        # Ignore common directories that shouldn't be uploaded
        ignore_dirs = {'.git', '__pycache__', 'node_modules', '.pytest_cache',
                      'venv', 'env', '.venv', 'build', 'dist', '.idea', '.vscode'}

        # Ignore common file patterns
        ignore_patterns = {'.pyc', '.pyo', '.class', '.o', '.so', '.dylib',
                         '.dll', '.exe', '.DS_Store', '.gitignore'}

        for root, dirs, filenames in os.walk(temp_dir):
            # Remove ignored directories from the walk
            dirs[:] = [d for d in dirs if d not in ignore_dirs]

            for filename in filenames:
                file_path = Path(root) / filename

                # Skip ignored file patterns
                if file_path.suffix in ignore_patterns or file_path.name in ignore_patterns:
                    continue

                # Get relative path from repo root
                rel_path = file_path.relative_to(temp_dir)
                all_file_paths.append(rel_path)

                # Read file content (skip binary files and large files)
                try:
                    # Skip files larger than 1MB
                    file_size = file_path.stat().st_size
                    if file_size > 1_000_000:
                        print(f"Skipping large file: {rel_path}")
                        continue

                    # Try to read as text
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    files.append(GitHubFile(
                        name=filename,
                        path=str(rel_path).replace('\\', '/'),  # Normalize path separators
                        content=content,
                        size=file_size
                    ))

                except (UnicodeDecodeError, PermissionError):
                    # Skip binary files or files we can't read
                    print(f"Skipping binary/unreadable file: {rel_path}")
                    continue

        # Detect primary language
        detected_language = detect_language_from_files(all_file_paths)

        print(f"Collected {len(files)} files from repository")

        return GitHubCloneResponse(
            repo_name=repo_name,
            files=files,
            total_files=len(files),
            detected_language=detected_language
        )

    except git.GitCommandError as e:
        raise HTTPException(400, f"Failed to clone repository: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Error processing repository: {str(e)}")
    finally:
        # Clean up temporary directory
        try:
            shutil.rmtree(temp_dir)
            print(f"Cleaned up temporary directory: {temp_dir}")
        except Exception as e:
            print(f"Warning: Failed to clean up temp directory {temp_dir}: {e}")


@app.post("/repair/{run_id}")
async def repair(run_id: str, req: RepairRequest):
    run_dir = os.path.join(WORKDIR, run_id)

    files = os.listdir(run_dir)
    if not files:
        raise HTTPException(404, "No file in run directory")

    filename = files[0]
    max_attempts = 8

    # Save original code before any modifications
    source_path = os.path.join(run_dir, filename)
    with open(source_path) as f:
        original_code = f.read().strip()  # Normalize whitespace

    # Initial run to check if code is already working
    if req.language == "python":
        ret, out, err = run_python(run_id, filename)
        print(f"INITIAL RUN - RET: {ret}, OUT:\n{out}\nERR:\n{err}")
    else:
        ret, out, err = run_java(run_id, filename)
        print(f"INITIAL RUN - RET: {ret}, OUT:\n{out}\nERR:\n{err}")

    # Check if already successful
    if ret == 0 and (req.expected_output is None or out.strip() == req.expected_output.strip()):
        return {
            "status": "success",
            "iterations": 0,
            "output": out,
            "message": "Code was already working",
            "original_code": original_code,
            "fixed_code": original_code
        }

    # Attempt fixes
    for attempt in range(1, max_attempts + 1):
        print(f"\n=== FIX ATTEMPT {attempt}/{max_attempts} ===")

        # Load current source
        source_path = os.path.join(run_dir, filename)
        with open(source_path) as f:
            src = f.read()

        # Build LLM prompt
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

        # Call LLM to fix
        raw = call_llm(prompt)
        print(f"LLM RAW OUTPUT:\n{raw}")

        # Extract and save fixed code
        new_code = extract_code_only(raw)
        print(f"CLEANED CODE:\n{new_code}")

        with open(source_path, "w") as f:
            f.write(new_code)

        # Verify the fix by running again
        if req.language == "python":
            ret, out, err = run_python(run_id, filename)
            print(f"VERIFICATION RUN {attempt} - RET: {ret}, OUT:\n{out}\nERR:\n{err}")
        else:
            ret, out, err = run_java(run_id, filename)
            print(f"VERIFICATION RUN {attempt} - RET: {ret}, OUT:\n{out}\nERR:\n{err}")

        # Check if fix was successful
        if ret == 0 and (req.expected_output is None or out.strip() == req.expected_output.strip()):
            # Read the fixed code
            with open(source_path) as f:
                fixed_code = f.read().strip()  # Normalize whitespace

            return {
                "status": "success",
                "iterations": attempt,
                "output": out,
                "message": f"Fixed after {attempt} attempt(s)",
                "original_code": original_code,
                "fixed_code": fixed_code
            }

    # Max attempts reached, return current state
    # Read the last attempted fix
    with open(source_path) as f:
        fixed_code = f.read().strip()  # Normalize whitespace

    return {
        "status": "failed",
        "iterations": max_attempts,
        "last_output": out,
        "last_error": err,
        "last_exit_code": ret,
        "message": f"Could not fix after {max_attempts} attempts",
        "original_code": original_code,
        "fixed_code": fixed_code
    }
