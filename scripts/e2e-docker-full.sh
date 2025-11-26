#!/bin/bash
set -e

echo "🚀 Starting E2E test environment with Docker..."
echo ""

# Start all services including frontend and Kong
echo "Starting all services..."
docker compose -f docker-compose.e2e.yml up -d kong frontend

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
echo "✅ All services are ready!"
echo ""

# Run the tests
echo "🧪 Running E2E tests..."
docker compose -f docker-compose.e2e.yml --profile test run --rm playwright

echo ""
echo "✅ Tests complete!"
echo ""
echo "Test results and reports are available in:"
echo "  - frontend/test-results/"
echo "  - frontend/playwright-report/"
echo ""
echo "Services are still running. To stop them, run:"
echo "  ./scripts/e2e-stop.sh"
