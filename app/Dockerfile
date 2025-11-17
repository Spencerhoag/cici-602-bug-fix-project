FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# - docker.io → Docker CLI (needed because we run "docker run …" via subprocess)
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

# Verify docker is installed
RUN which docker && docker --version

# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn python-multipart gitpython requests supabase

# Copy the app code
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
