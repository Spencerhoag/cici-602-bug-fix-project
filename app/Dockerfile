FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies:
# - docker.io → Docker CLI (needed because we run "docker run …" via subprocess)
RUN apt-get update && \
    apt-get install -y docker.io && \
    apt-get clean

# Install Python dependencies
RUN pip install fastapi uvicorn python-multipart gitpython requests

RUN pip install supabase
# Copy the app code
COPY . .

# Start FastAPI server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
