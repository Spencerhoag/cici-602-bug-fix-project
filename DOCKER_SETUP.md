# Docker Setup Guide

This guide explains how to run the CICI application using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured in the project root directory

## Environment Setup

1. **Copy the example environment file to project root:**
   ```bash
   cp frontend/.env.example .env
   ```

2. **Edit `.env` (in project root) with your Supabase credentials:**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

   **Note:** The `.env` file should be in the project root directory, not in `frontend/`. This single file is used by both Docker Compose and the frontend build.

## Running with Docker Compose

From the project root directory:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:
- **Frontend** (React + Vite) - http://localhost:3000
- **Backend API** (FastAPI) - http://localhost:8000
- **Ollama** (LLM service) - http://localhost:11434

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Development vs Production

### Development (without Docker)

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Access at http://localhost:5173

**Backend:**
```bash
cd app
pip install -r requirements.txt
python server.py
```
Access at http://localhost:8000

### Production (with Docker)

Use Docker Compose as described above. The frontend will be built and served via nginx on port 3000.

## Troubleshooting

### Frontend not loading
- Check that `.env` file exists in `frontend/` directory
- Verify Supabase credentials are correct
- Check logs: `docker-compose logs frontend`

### Backend API errors
- Check logs: `docker-compose logs app`
- Ensure Ollama service is running: `docker-compose logs ollama`

### Port conflicts
If ports 3000, 8000, or 11434 are already in use, update `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:80"  # For frontend
  - "YOUR_PORT:8000"  # For backend
```

## Services

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| Frontend | cici-frontend | 3000 | React UI served by nginx |
| Backend | code-fixer-api | 8000 | FastAPI server |
| Ollama | ollama | 11434 | LLM inference service |

## Health Checks

- Frontend: http://localhost:3000/health
- Backend: http://localhost:8000/docs (Swagger UI)
- Ollama: http://localhost:11434/api/tags

## Database Setup

The app uses Supabase for the database. Make sure you've set up your Supabase tables:

1. Run the SQL schema from the Supabase dashboard
2. Disable RLS on tables: `users`, `projects`, `project_files`, `issues`
3. Create the `project-files` storage bucket

See the Supabase dashboard for more details.
