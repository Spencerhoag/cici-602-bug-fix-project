from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess, uuid, os, shutil, json, tempfile
from pydantic import BaseModel
from typing import Optional, List, Dict
import re
from pathlib import Path
import zipfile
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

WORKDIR = "/repair_data"


class RepairRequest(BaseModel):
    expected_output: Optional[str] = None
    language: str  # python or java
    entry_file: str | None = None  # chosen by the user in UI if there are multiple files OR auto-detected in repair function if just one file is uploaded


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
    # repair_data is mounted at /repair_data inside the container
    host_base = f"/repair_data/{run_id}"
    host_src = os.path.join(host_base, filename)

    if not os.path.exists(host_base):
        raise FileNotFoundError(f"Upload directory not found on host: {host_base}")

    if not os.path.exists(host_src):
        raise FileNotFoundError(f"Source file not found on host: {host_src}")

    runner_name = f"python_runner_{uuid.uuid4().hex[:8]}"

    subprocess.run(
        ["docker", "create", "--name", runner_name, "python-runner", "python", filename],
        capture_output=True,
        text=True,
        check=True
    )
    print("Created docker container:", runner_name)

    # create folder inside container
    dirname = os.path.dirname(filename)
    subprocess.run(
        ["docker", "exec", runner_name, "mkdir", "-p", f"/work/{dirname}"],
        capture_output=True,
        text=True
    )
    print("Created directory inside container:", dirname)

    # copy the entire run_id folder
    subprocess.run(
        ["docker", "cp", host_base + "/.", f"{runner_name}:/work"],
        capture_output=True,
        text=True,
        check=True
    )
    print("Copied files into container")

    proc = subprocess.run(
        ["docker", "start", "-a", runner_name],
        capture_output=True,
        text=True
    )
    print("Container run complete. Cleaning up.")

    subprocess.run(["docker", "rm", "-f", runner_name], capture_output=True)

    return proc.returncode, proc.stdout, proc.stderr


def run_java(run_id, main_file):
    """
    run_id: folder under /repair_data/<run_id> containing uploaded .java files
    main_file: the filename that contains the main(...) entrypoint, e.g. "Main.java"
    """

    host_base = f"/repair_data/{run_id}"
    host_main_path = os.path.join(host_base, main_file)

    if not os.path.exists(host_base):
        raise FileNotFoundError(f"Upload directory not found: {host_base}")

    if not os.path.exists(host_main_path):
        raise FileNotFoundError(f"Main file not found: {host_main_path}")

    runner_name = f"java_runner_{uuid.uuid4().hex[:8]}"

    # Java runner image must:
    # - copy /work
    # - run: javac *.java && java MainClass
    subprocess.run(
        [
            "docker", "create", "--name", runner_name,
            "java-runner",  # <--- This is your custom Java runner image
            "bash", "-lc",
            f"javac {main_file.replace('.java','')}.java && java {main_file.replace('.java','')}"
        ],
        capture_output=True,
        text=True,
        check=True
    )
    print("Created docker container:", runner_name)

    # Ensure directory exists inside container
    dirname = os.path.dirname(main_file)
    subprocess.run(
        ["docker", "exec", runner_name, "mkdir", "-p", f"/work/{dirname}"],
        capture_output=True,
        text=True
    )
    print("Created directory inside container:", dirname)

    # Copy entire directory for multi-file support
    subprocess.run(
        ["docker", "cp", host_base + "/.", f"{runner_name}:/work"],
        capture_output=True,
        text=True,
        check=True
    )
    print("Copied Java project into container")

    # Run container
    proc = subprocess.run(
        ["docker", "start", "-a", runner_name],
        capture_output=True,
        text=True
    )
    print("Container run complete. Cleaning up.")

    # Cleanup
    subprocess.run(["docker", "rm", "-f", runner_name], capture_output=True)

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


def extract_json(text: str) -> str:
    """
    Extract the first top-level JSON object { ... } from LLM output.
    Works even if explanations, backticks, or extra text are present.
    """

    # Strip markdown fences
    text = text.replace("```json", "").replace("```", "")

    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object start '{' found in LLM output")

    # Scan forward and track braces to find the matching '}'
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:  # Found the full balanced JSON object
                return text[start:i + 1]

    raise ValueError("No complete JSON object found (unbalanced braces)")


def normalize_llm_json(s: str) -> str:
    """
    Convert LLM output using Python triple-quoted strings into valid JSON.
    """
    # Replace """text""" with "text" (triple → single)
    # Handles multi-line content.
    s = re.sub(
        r'"""\s*(.*?)\s*"""',
        lambda match: json.dumps(match.group(1)),  # ensures proper escaping
        s,
        flags=re.DOTALL
    )
    return s


@app.post("/upload")
async def upload(file: UploadFile = File(...), language: str = "python"):
    run_id = uuid.uuid4().hex
    run_dir = os.path.join(WORKDIR, run_id)
    os.makedirs(run_dir, exist_ok=True)

    filename = file.filename.lower()

    # CASE 1: ZIP FILE UPLOAD
    if filename.endswith(".zip"):
        zip_path = os.path.join(run_dir, "upload.zip")
        with open(zip_path, "wb") as f:
            f.write(await file.read())

        # Extract zip
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(run_dir)
        except zipfile.BadZipFile:
            raise HTTPException(400, "Uploaded file is not a valid zip archive")

        # List extracted files
        extracted_files = []
        for root, dirs, files in os.walk(run_dir):

            # Ignore junk directories
            dirs[:] = [d for d in dirs if not d.startswith("__MACOSX")]

            for f in files:
                # Skip zip itself
                if f == "upload.zip":
                    continue

                # Skip macOS junk files
                if f.startswith(".") or f.endswith(".DS_Store") or "__MACOSX" in root:
                    continue

                relpath = os.path.relpath(os.path.join(root, f), run_dir)
                extracted_files.append(relpath)

        # Filter so only paths that start with the directory name are returned
        # Example: keep only "syntax_fix_dir/..."
        top_level_dirs = [d for d in os.listdir(run_dir) 
                          if os.path.isdir(os.path.join(run_dir, d)) and not d.startswith("__MACOSX")]


        return {
            "run_id": run_id,
            "files": extracted_files,
            "directory": True,
            "message": "Zip directory uploaded and extracted successfully"
        }

    # CASE 2: SINGLE FILE UPLOAD
    else:
        dest_path = os.path.join(run_dir, file.filename)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)

        with open(dest_path, "wb") as f:
            f.write(await file.read())
        

        return {
            "run_id": run_id,
            "files": [file.filename],
            "directory": False,
            "message": "Single file uploaded successfully"
        }


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
    print("ENTERED /repair endpoint")

    single_file = False
    run_dir = os.path.join(WORKDIR, run_id)

    # Collect all files in the run directory (recursive)
    project_files = []
    for root, dirs, files in os.walk(run_dir):
        for f in files:
            # ignore uploaded zip
            if f == "upload.zip":
                continue
            rel = os.path.relpath(os.path.join(root, f), run_dir)
            project_files.append(rel)

    print(f"Project files collected in run dir: {project_files}")

    if not project_files:
        raise HTTPException(404, "No files found in uploaded project")

    # ================================
    # ENTRY FILE SELECTION
    # ================================
    # CASE 1: only one file → auto-use it
    if len(project_files) == 1:
        single_file = True
        entry_file = project_files[0]

    # CASE 2: user must provide entry_file
    else:
        if not req.entry_file:
            raise HTTPException(
                status_code=400,
                detail="Multiple files uploaded. You must specify 'entry_file'."
            )
        if req.entry_file not in project_files:
            raise HTTPException(
                status_code=400,
                detail=f"Selected entry_file '{req.entry_file}' does not exist in uploaded directory"
            )
        entry_file = req.entry_file

    max_attempts = 8

    # Save original code before any modifications
    original_code = {}

    for root, _, files in os.walk(run_dir):
        # Skip entire __MACOSX directories
        if "__MACOSX" in root:
            continue

        for name in files:
            # Skip the uploaded zip file itself
            if name.lower().endswith(".zip"):
                continue

            # Skip macOS junk files
            if name.startswith("._") or name == ".DS_Store":
                continue

            file_path = os.path.join(root, name)
            rel_path = os.path.relpath(file_path, run_dir)

            # Now it's safe to open
            with open(file_path, "r", errors="ignore") as f:
                original_code[rel_path] = f.read().strip()

    
    print("Original code collected for repair")

    # Initial run to check if code is already working
    if req.language == "python":
        print("Running initial Python execution")
        ret, out, err = run_python(run_id, entry_file)
        print(f"INITIAL RUN - RET: {ret}, OUT:\n{out}\nERR:\n{err}")
    else:
        ret, out, err = run_java(run_id, entry_file)
        print(f"INITIAL RUN - RET: {ret}, OUT:\n{out}\nERR:\n{err}")

    # Check if already successful
    if ret == 0 and (req.expected_output is None or out.strip() == req.expected_output.strip()):

        fixed_code_map = {}

        for f in project_files:
            name = os.path.basename(f).lower()

            # Skip junk files
            if (
                name.startswith("__") or
                name.endswith(".zip") or
                name == ".ds_store" or
                name.startswith("._")
            ):
                continue

            abs_path = os.path.join(run_dir, f)

            try:
                with open(abs_path, "r", encoding="utf-8") as fp:
                    fixed_code_map[f] = fp.read().strip()
            except Exception as e:
                print(f"Skipping non-text file {f}: {e}")
                continue

        return {
            "status": "success",
            "iterations": 0,
            "output": out,
            "message": "Code was already working",
            "original_code": original_code,
            "fixed_code": fixed_code_map
        }

    # Attempt fixes
    for attempt in range(1, max_attempts + 1):
        print(f"\n=== FIX ATTEMPT {attempt}/{max_attempts} ===")

        def build_llm_project_payload(original_code: dict) -> str:
            """
            Convert {relative_path: source_code} into an LLM-friendly payload.
            """
            chunks = []

            for rel_path, code in original_code.items():
                chunks.append(
                    f"===== FILE: {rel_path} =====\n"
                    f"{code}\n"
                    f"===== END FILE {rel_path} =====\n"
                )

            return "\n".join(chunks)


        project_payload = build_llm_project_payload(original_code)
        print(f"LLM project payload built:\n{project_payload}")

        # Build LLM prompt for single file repair
        if single_file:
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
- KEEP THE ORIGINAL STRUCTURE unless strictly necessary.

INPUT FILE NAME: {entry_file}

CURRENT CODE:
{original_code[entry_file]}

STDERR:
{err}

EXIT CODE:
{ret}

EXPECTED OUTPUT:
{req.expected_output}

RETURN ONLY THE FULL FIXED CODE BELOW NOTHING ELSE:
"""
        # Build LLM prompt for multi-file repair
        else:
            prompt = f"""
You are a code auto-repair tool.

CRITICAL: Your response MUST be ONLY a valid JSON object. No explanations, no markdown, no extra text.

OUTPUT FORMAT (this is the ONLY acceptable output):
{{
  "main.py": "file contents here",
  "utils.py": "file contents here"
}}

CRITICAL RULES:
1. Change ONLY what is necessary to fix the error - do not refactor or improve code
2. PRESERVE ALL import statements (they are needed for dependencies between files)
3. PRESERVE ALL function and class definitions exactly as they are
4. If a function is called but has a typo in the call, fix ONLY the call, not the imports

Below is the full project directory.
Each file is marked with '===== FILE: <path> ====='.

{project_payload}

TASK:
Fix the error to match the expected output. The error is shown in STDERR below.

Expected output:
{req.expected_output}

STDERR:
{err}

EXIT CODE:
{ret}

REMEMBER: Return ONLY the JSON object with filename keys and fixed code values. Make minimal changes.
"""

        # Call LLM to fix
        # For multi-file mode, force JSON output format
        raw = call_llm(prompt, format="json" if not single_file else None)
        print(f"LLM RAW OUTPUT:\n{raw}")

        if single_file:

            # Extract and save fixed code
            new_code = extract_code_only(raw)
            print(f"CLEANED CODE:\n{new_code}")

            with open(os.path.join(run_dir, entry_file), "w") as f:
                f.write(new_code)

            # Verify the fix by running again
            if req.language == "python":
                ret, out, err = run_python(run_id, entry_file)
                print(f"VERIFICATION RUN {attempt} - RET: {ret}, OUT:\n{out}\nERR:\n{err}")
            else:
                ret, out, err = run_java(run_id, entry_file)
                print(f"VERIFICATION RUN {attempt} - RET: {ret}, OUT:\n{out}\nERR:\n{err}")

            # Check if fix was successful
            if ret == 0 and (req.expected_output is None or out.strip() == req.expected_output.strip()):
                # Read the fixed code
                with open(os.path.join(run_dir, entry_file)) as f:
                    fixed_code = f.read().strip()  # Normalize whitespace

                return {
                    "status": "success",
                    "iterations": attempt,
                    "output": out,
                    "message": f"Fixed after {attempt} attempt(s)",
                    "original_code": original_code,
                    "fixed_code": fixed_code
                }
    
        else:
            # MULTI-FILE MODE

            # The LLM MUST return JSON like:
            # { "file1.py": "new contents", "dir/utils.py": "new contents" }

            try:
                cleaned_json = extract_json(raw)
                cleaned_json = normalize_llm_json(cleaned_json)
                print(f"CLEANED JSON:\n{cleaned_json}")
                fixes = json.loads(cleaned_json)
                if not isinstance(fixes, dict):
                    raise ValueError("LLM JSON must be an object mapping filename → content")
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"LLM output is not valid JSON: {e}\nRaw Output:\n{raw}"
                )

            # Apply changes
            for rel_path, new_contents in fixes.items():
                abs_path = os.path.join(run_dir, rel_path)

                # prevent escaping the project dir
                if not os.path.commonpath([run_dir, abs_path]).startswith(run_dir):
                    raise HTTPException(
                        400,
                        f"LLM attempted to write outside project: {rel_path}"
                    )

                # ensure directory exists
                os.makedirs(os.path.dirname(abs_path), exist_ok=True)

                with open(abs_path, "w") as f:
                    f.write(new_contents)

            # Verify fix
            if req.language == "python":
                ret, out, err = run_python(run_id, entry_file)
            else:
                ret, out, err = run_java(run_id, entry_file)

            print(f"VERIFICATION RUN {attempt} - RET: {ret}, OUT:\n{out}\nERR:\n{err}")

            # If successful, return entire updated directory
            if ret == 0 and (req.expected_output is None or out.strip() == req.expected_output.strip()):
                fixed_code_map = {}

                for f in project_files:
                    name = os.path.basename(f).lower()

                    # Skip junk files
                    if (
                        name.startswith("__") or
                        name.endswith(".zip") or
                        name == ".ds_store" or
                        name.startswith("._")
                    ):
                        continue

                    abs_path = os.path.join(run_dir, f)

                    try:
                        with open(abs_path, "r", encoding="utf-8") as fp:
                            fixed_code_map[f] = fp.read().strip()
                    except Exception as e:
                        print(f"Skipping non-text file {f}: {e}")
                        continue


                return {
                    "status": "success",
                    "iterations": attempt,
                    "output": out,
                    "message": f"Fixed after {attempt} attempt(s)",
                    "original_code": original_code,
                    "fixed_code": fixed_code_map
                }
    # If neither branch succeeded, we fall through to here:
    # FINAL FAILURE RETURN
    fixed_on_disk = {
        f: open(os.path.join(run_dir, f)).read().strip()
        for f in project_files
    }

    return {
        "status": "failed",
        "iterations": max_attempts,
        "last_output": out,
        "last_error": err,
        "last_exit_code": ret,
        "message": f"Could not fix after {max_attempts} attempts",
        "original_code": original_code,
        "fixed_code": fixed_on_disk
    }
