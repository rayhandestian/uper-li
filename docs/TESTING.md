# Testing Guide

This project uses **Jest** for testing. We aim for high test coverage to ensure reliability and security.

## Running Tests

### All Tests
Run all tests in the project:
```bash
npm test
```

### Watch Mode
Run tests in watch mode (re-runs on file changes):
```bash
npm run test:watch
```

### Coverage
Generate a coverage report:
```bash
npm run test:coverage
```
Coverage reports are generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` to view the report.

## Writing Tests

### Test Location
- Unit tests for `src/lib` go in `src/lib/__tests__`
- Integration tests for API routes go in `src/app/api/__tests__`
- Component tests go in `src/components/__tests__`

### Naming Convention
Test files should end with `.test.ts` or `.test.tsx`.

### Using Test Utilities
We provide a set of utilities in `src/__tests__/test-utils.ts` to make testing easier.

**Example:**
```typescript
import { createMockRequest, createMockSession } from '@/__tests__/test-utils'

it('should return 401 if not authenticated', async () => {
  // Mock session
  (getServerSession as jest.Mock).mockResolvedValue(null)

  // Create request
  const req = createMockRequest('http://localhost/api/protected')
  
  // Call handler...
})
```

### Mocking Database
We mock the database using `jest.mock('@/lib/db')`.

**Example:**
```typescript
import { db } from '@/lib/db'
import { mockDbSuccess } from '@/__tests__/test-utils'

// Mock successful query
(db.query as jest.Mock).mockResolvedValue(
  mockDbSuccess([{ id: 1, name: 'Test' }])
)
```

## CI/CD

Tests are automatically run on every push and pull request to `main` and `develop` branches via GitHub Actions.
The workflow includes:
1. Linting
2. Running all tests
3. Uploading coverage reports
