# CICI - AI-Powered Code Bug Fixer

> **Status**: Idea Phase - Planning & Design

## How to Run
1. Go to root directory
2. docker compose build app - Builds container (only have to do this once or if changes are made)
3. cd into “runners”
4. docker build -t python-runner -f python.Dockerfile . - Builds python runner container (only have to do this once unless changes are made to python-runner Dockerfile)
5. Docker compose up -d - Starts containers
6. docker exec -it ollama ollama pull codellama:7b-instruct - Pull code llama llm (only have to do this on first build)
8. http://localhost:8000/docs - Opens swagger ui
 docker logs -f code-fixer-api    - Access logs for debugging

## Overview

An automated bug-fixing application that uses AI models to iteratively debug and fix code by running it in a safe, containerized environment. The system analyzes errors, applies fixes, and repeats until the code runs successfully.

## Concept

Users upload their buggy code along with the expected output. The application:
1. Runs the code in a Docker container
2. Captures any errors or incorrect output
3. Uses an AI model to analyze and fix the issues
4. Repeats the process until the code executes without errors
5. Returns the corrected code to the user

## Planned Features

### Code Upload Options
- **Single File**: Upload individual source files
- **Zip Archive**: Upload multiple files as a compressed archive
- **GitHub Repository**: Provide a public repository URL for cloning

### Error Detection & Fixing
- **Syntax Errors**: Automatic detection and correction of compilation/interpretation errors
- **Runtime Errors**: Fix crashes, exceptions, and runtime failures
- **Semantic Errors**: Compare actual output against user-provided expected output and fix logical issues

### Supported Languages
- Python
- Java
- C

## Technical Approach

### AI Models (Under Evaluation)
- Locally runnable models (for privacy and cost)
- Free-tier options like Google Gemini
- Other open-source code models

### Execution Environment
- **Docker**: Isolated containers for safe code execution
- Each code submission runs in a fresh container
- Automatic cleanup after processing

### Limitations
- **No Secrets Management**: This tool is not designed to handle API keys, credentials, or sensitive data
- **Public Repositories Only**: GitHub integration limited to public repos

## Use Cases

- Students debugging homework assignments
- Developers quickly fixing small code snippets
- Learning from AI-generated fixes
- Rapid prototyping and testing

## Future Considerations

- Support for additional programming languages
- GitHub issue integration
- Batch processing of multiple files
- Enhanced semantic error detection
- Code quality and optimization suggestions

---

**Note**: This project is in early conceptual stages. Features and specifications are subject to change.
