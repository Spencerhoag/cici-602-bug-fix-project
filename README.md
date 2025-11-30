# CICI - AI-Powered Code Bug Fixer

An automated bug-fixing application with a React frontend and FastAPI backend that uses AI models to iteratively debug and fix code by running it in safe, containerized environments.

## Quick Start with Docker

The easiest way to run CICI is using Docker Compose:

```bash
# 1. Set up environment variables (in project root)
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Set up Supabase database
# See frontend/SUPABASE_SETUP_GUIDE.md

# 3. Build and run all services
docker-compose up --build
```

**Services:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Ollama (LLM): http://localhost:11434

### Docker Commands Reference

```bash
# Build images only (completes and exits)
docker-compose build

# Build and run in foreground (press Ctrl+C to stop)
docker-compose up --build

# Build and run in background (detached mode)
docker-compose up -d --build

# Stop running containers
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View logs
docker-compose logs -f

# Run backend unit tests
pytest -q

# Rebuild specific service
docker-compose build frontend
docker-compose build app
```

**Note:** `docker-compose up` starts the servers and keeps them running. This is expected behavior. Use `docker-compose down` to stop all services.

For detailed setup instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

## Manual Setup (Development)

### Backend

```bash
cd app
pip install -r requirements.txt
python server.py
```

Access API docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Access UI at http://localhost:5173

### Language Runners

Build the Docker containers for code execution:

```bash
cd runners
docker build -t python-runner -f python.Dockerfile .
docker build -t java-runner -f java.Dockerfile .
```

### Ollama Setup

```bash
# Pull the LLM model
docker exec -it ollama ollama pull codellama:7b-instruct
```

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│   FastAPI    │─────▶│   Ollama    │
│  Frontend   │◀─────│   Backend    │◀─────│   (LLM)     │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Docker     │
                     │   Runners    │
                     │ (Python/Java)│
                     └──────────────┘
```

## Features

### Current Features
- **Web UI**: Modern React interface with authentication
- **Project Management**: Upload and manage code projects
- **Issue Tracking**: Create and track bug fix requests
- **AI-Powered Fixes**: Automatic code repair using LLM
- **Secure Execution**: Code runs in isolated Docker containers
- **Multi-language**: Support for Python and Java

### Code Upload Options
- Single file upload
- Zip archive (preserves folder structure)
- GitHub repository URL (coming soon)

### Error Detection
- Syntax errors
- Runtime errors and exceptions
- Semantic errors (with expected output comparison)

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Supabase for authentication and database

**Backend:**
- FastAPI (Python)
- Docker for code execution
- Ollama for LLM inference
- WebSocket support for real-time updates

**Infrastructure:**
- Docker & Docker Compose
- Nginx (production frontend server)
- Supabase (PostgreSQL + Auth)

## Database

The app uses Supabase (PostgreSQL) with these tables:
- `users` - User accounts
- `projects` - Code projects
- `project_files` - File metadata
- `issues` - Bug fix requests and results

See [frontend/SUPABASE_SETUP_GUIDE.md](./frontend/SUPABASE_SETUP_GUIDE.md) for setup instructions.

## Configuration

### Environment Variables

**Root** (`.env` in project root):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

**Backend** (configure in `docker-compose.yml`):
```yaml
OLLAMA_HOST: http://ollama:11434
```

## Development

### Debugging

```bash
# View logs
docker-compose logs -f frontend
docker-compose logs -f app
docker-compose logs -f ollama

# Access container
docker exec -it cici-frontend sh
docker exec -it code-fixer-api bash
```

### Testing

```bash
# Backend tests
cd app
pytest

# Frontend tests
cd frontend
npm test
```

## Deployment

For production deployment:

1. Update environment variables for production
2. Enable RLS on Supabase tables
3. Configure CORS settings
4. Set up proper SSL/TLS certificates
5. Use production-grade secrets management

## Limitations

- No secrets management (don't upload API keys or credentials)
- Public repositories only for GitHub integration
- Maximum file size limits apply
- LLM inference requires significant computational resources

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Check [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- Check [frontend/SUPABASE_SETUP_GUIDE.md](./frontend/SUPABASE_SETUP_GUIDE.md)
- Open an issue on GitHub
