# E2E Testing Setup

## Overview

E2E tests run with a full stack:
- **Supabase** - Local database and authentication
- **Backend** - FastAPI server (docker-compose)
- **Frontend** - Vite dev server (started by Playwright)

## GitHub Actions Workflow

The E2E test workflow:

1. **Start Supabase** - Local Postgres + Auth service
2. **Seed Database** - Create test user account
3. **Start Backend** - Launch API and Ollama via docker-compose
4. **Run Tests** - Playwright tests with real authentication
5. **Cleanup** - Stop all services

## Test User Credentials

**Email:** `test@example.com`
**Password:** `testpassword123`

Available as environment variables:
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

## Test Helpers

### Authentication Helper

```typescript
import { signInTestUser, signOut } from './helpers/test-auth'

test('my test', async ({ page }) => {
  // Sign in with test user
  await signInTestUser(page)

  // Do authenticated actions
  // ...

  // Sign out
  await signOut(page)
})
```

## Local Testing

To run E2E tests locally, you need:

1. **Install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase  # macOS
   # or
   scoop install supabase             # Windows
   ```

2. **Start Supabase:**
   ```bash
   supabase start
   ```

3. **Get credentials:**
   ```bash
   supabase status
   ```

4. **Create .env:**
   ```bash
   cd frontend
   cat > .env << EOF
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=<key from supabase status>
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   EOF
   ```

5. **Start backend:**
   ```bash
   docker compose up -d
   ```

6. **Run tests:**
   ```bash
   cd frontend
   npm run test:e2e
   ```

## Supabase Configuration

Located in `supabase/config.toml`:

- **Database Port:** 54322
- **API Port:** 54321
- **Studio Port:** 54323 (web UI)

Access Supabase Studio: http://localhost:54323

## Database Seeding

Test data is seeded in GitHub Actions via `supabase/seed.sql` and direct SQL in the workflow.

To add more test data, edit:
- `supabase/seed.sql` - Runs after migrations
- GitHub Actions workflow - Direct SQL commands

## Cleanup

After running tests:

```bash
# Stop Supabase
supabase stop

# Stop backend
docker compose down -v
```

## CI/CD Workflow Files

- `.github/workflows/frontend-tests.yml` - Main workflow
- `supabase/config.toml` - Supabase configuration
- `supabase/seed.sql` - Database seed data
- `frontend/e2e/helpers/test-auth.ts` - Auth helper
- `frontend/e2e/auth.spec.ts` - Auth tests

## Troubleshooting

### Supabase won't start
```bash
supabase stop
supabase start
```

### Test user login fails
Check that the user was created:
```bash
supabase db reset
```

### Backend not accessible
```bash
docker compose logs app
```

### Port conflicts
Change ports in `supabase/config.toml` if needed.
