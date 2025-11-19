#!/bin/bash
set -e

echo "🚀 Starting E2E test environment..."
echo ""

# Start all services
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

# Create .env file for frontend
echo ""
echo "📝 Creating frontend .env file..."
cat > frontend/.env << 'EOF'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF
echo "✅ Frontend .env created"

echo ""
echo "✅ E2E environment is ready!"
echo ""
echo "Services running at:"
echo "  - Supabase API: http://localhost:54321"
echo "  - Backend API:   http://localhost:8000/docs"
echo "  - Ollama:        http://localhost:11434"
echo "  - PostgreSQL:    localhost:54322"
echo ""
echo "Test credentials:"
echo "  - Email:    test@example.com"
echo "  - Password: testpassword123"
echo ""
echo "To run E2E tests:"
echo "  cd frontend && npm run test:e2e"
echo ""
echo "To stop services:"
echo "  ./scripts/e2e-stop.sh"
