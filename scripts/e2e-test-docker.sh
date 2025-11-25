#!/bin/bash
set -e

echo "🧪 Running E2E tests in Docker..."
echo ""

# Build and run the Playwright service
echo "Building and starting test containers..."
docker compose -f docker-compose.e2e.yml --profile test up --build playwright --exit-code-from playwright

echo ""
echo "✅ E2E tests complete!"
echo ""
echo "Test results and reports are available in:"
echo "  - frontend/test-results/"
echo "  - frontend/playwright-report/"
