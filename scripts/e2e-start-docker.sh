#!/bin/bash
set -e

echo "🚀 Starting E2E test environment with Docker (including frontend)..."
echo ""

# Start all services including frontend
docker compose -f docker-compose.e2e.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
timeout 60 bash -c 'until docker compose -f docker-compose.e2e.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 2; done'
echo "✅ PostgreSQL is ready"

# Wait for Kong API Gateway
echo "Waiting for Kong..."
timeout 60 bash -c 'until curl -f http://localhost:54321 > /dev/null 2>&1; do sleep 2; done'
echo "✅ Kong is ready"

# Wait for Backend
echo "Waiting for Backend..."
timeout 60 bash -c 'until curl -f http://localhost:8000/docs > /dev/null 2>&1; do sleep 2; done'
echo "✅ Backend is ready"

# Wait for Frontend
echo "Waiting for Frontend..."
timeout 120 bash -c 'until curl -f http://localhost:3000 > /dev/null 2>&1; do sleep 2; done'
echo "✅ Frontend is ready"

echo ""
echo "✅ E2E environment is ready!"
echo ""
echo "Services running at:"
echo "  - Frontend:      http://localhost:3000"
echo "  - Supabase API:  http://localhost:54321"
echo "  - Backend API:   http://localhost:8000/docs"
echo "  - Ollama:        http://localhost:11434"
echo "  - PostgreSQL:    localhost:54322"
echo ""
echo "Test credentials:"
echo "  - Email:    test@example.com"
echo "  - Password: testpassword123"
echo ""
echo "To run E2E tests in Docker:"
echo "  npm run e2e:test:docker"
echo ""
echo "To stop services:"
echo "  ./scripts/e2e-stop.sh"
