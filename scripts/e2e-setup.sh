#!/bin/bash
set -e

echo "🔧 Setting up E2E testing environment..."
echo ""

# Install Playwright browsers
echo "📥 Installing Playwright browsers..."
cd frontend
npx playwright install chromium
cd ..

echo ""
echo "✅ E2E setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start services:  ./scripts/e2e-start.sh"
echo "  2. Run tests:       cd frontend && npm run test:e2e"
echo "  3. Stop services:   ./scripts/e2e-stop.sh"
