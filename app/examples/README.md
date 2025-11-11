# Backend Testing Examples

This directory contains example Python files with various bugs to test the CICI bug-fixing functionality.

## Available Example Files

1. **syntax_error.py** - Missing colon in function definition
2. **division_error.py** - Division by zero error
3. **name_error.py** - Undefined variable reference
4. **type_error.py** - String and integer concatenation issue
5. **logic_error.py** - Wrong output (incorrect initial value)
6. **index_error.py** - List index out of range
7. **working_example.py** - No errors (control test)

## How to Test the Backend

### Method 1: Using cURL

1. **Start the backend services** (from project root):
   ```bash
   docker compose up -d
   docker exec -it ollama ollama pull codellama:7b-instruct
   ```

2. **Upload a test file**:
   ```bash
   curl -X POST "http://localhost:8000/upload?language=python" \
     -F "file=@app/examples/syntax_error.py"
   ```

   This returns a `run_id`, for example:
   ```json
   {"run_id": "abc123...", "filename": "syntax_error.py"}
   ```

3. **Request repair** (replace `RUN_ID` with the value from step 2):
   ```bash
   curl -X POST "http://localhost:8000/repair/RUN_ID" \
     -H "Content-Type: application/json" \
     -d '{"language": "python"}'
   ```

4. **With expected output** (for logic_error.py):
   ```bash
   curl -X POST "http://localhost:8000/repair/RUN_ID" \
     -H "Content-Type: application/json" \
     -d '{"language": "python", "expected_output": "Sum: 150"}'
   ```

### Method 2: Using Swagger UI

1. **Start the backend services** (from project root):
   ```bash
   docker compose up -d
   docker exec -it ollama ollama pull codellama:7b-instruct
   ```

2. **Open Swagger UI**:
   ```
   http://localhost:8000/docs
   ```

3. **Test the `/upload` endpoint**:
   - Click on "POST /upload"
   - Click "Try it out"
   - Select a file from `app/examples/`
   - Set language to "python"
   - Click "Execute"
   - Copy the `run_id` from the response

4. **Test the `/repair/{run_id}` endpoint**:
   - Click on "POST /repair/{run_id}"
   - Click "Try it out"
   - Paste the `run_id` from previous step
   - In the request body, set:
     ```json
     {
       "language": "python",
       "expected_output": null
     }
     ```
   - Click "Execute"
   - Review the response to see if the bug was fixed

### Method 3: Using Python requests

Create a test script:

```python
import requests

# Upload file
with open('app/examples/syntax_error.py', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/upload',
        params={'language': 'python'},
        files={'file': f}
    )
    run_id = response.json()['run_id']
    print(f"Run ID: {run_id}")

# Repair code
response = requests.post(
    f'http://localhost:8000/repair/{run_id}',
    json={'language': 'python'}
)
print(response.json())
```

## Expected Behaviors

- **syntax_error.py**: Should fix missing colon
- **division_error.py**: Should change `count = 0` to `count = len(numbers)`
- **name_error.py**: Should define `email` variable or remove the line
- **type_error.py**: Should convert `age` to string with `str(age)`
- **logic_error.py**: Should change `total = 1` to `total = 0` (especially with expected output)
- **index_error.py**: Should change `items[10]` to `items[-1]` or `items[len(items)-1]`
- **working_example.py**: Should pass through with no changes

## Checking Logs

To see what's happening during the repair process:

```bash
docker logs -f code-fixer-api
```

This will show:
- Runner container creation
- Code execution output
- LLM prompts and responses
- Cleaned code being written back

## Troubleshooting

1. **"No such container"**: Make sure Docker services are running with `docker compose up -d`
2. **LLM errors**: Ensure CodeLlama model is pulled with `docker exec -it ollama ollama pull codellama:7b-instruct`
3. **File not found**: Check that the run_id is correct and the file was uploaded successfully
4. **Max iterations reached**: The LLM couldn't fix the bug in 3 attempts - check logs for details
