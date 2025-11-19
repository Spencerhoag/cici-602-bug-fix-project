#!/bin/bash
set -e

echo "🛑 Stopping E2E test environment..."

docker compose -f docker-compose.e2e.yml down -v

echo "✅ E2E environment stopped and cleaned up"
