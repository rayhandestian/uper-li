# Contributing to UPer.li

Thank you for your interest in contributing to UPer.li! We welcome contributions from the community and appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/UPer.li.git
   cd uper-link
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/rayhandestian/UPer.li.git
   ```

## Development Setup

Follow the setup instructions in the [README.md](README.md#installation) to get your development environment ready.

### Quick Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml). Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error messages (if applicable)
- Your environment details (OS, Node version, browser)

### Suggesting Features

We welcome feature suggestions! Please create an issue using the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml). Include:

- Clear description of the feature
- Use case and benefits
- Possible implementation approach (if you have ideas)

### Contributing Code

1. **Find or create an issue** for the change you want to make
2. **Comment on the issue** to let others know you're working on it
3. **Create a branch** from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feat/your-feature-name
   ```
4. **Make your changes** following our coding standards
5. **Write tests** for your changes
6. **Ensure all tests pass**:
   ```bash
   npm test
   npm run lint
   ```
7. **Commit your changes** following our commit message conventions
8. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```
9. **Open a Pull Request** against the `develop` branch

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict type checking
- Avoid using `any` type - use proper types or `unknown`
- Use interfaces for object shapes
- Document complex types with JSDoc comments

### Code Style

- Follow the existing code style in the project
- Use ESLint to check your code: `npm run lint`
- Format your code consistently with the project
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

### File Organization

- Place React components in `src/components/`
- Place API routes in `src/app/api/`
- Place utility functions in `src/lib/`
- Place type definitions in `src/types/`
- Place tests alongside the code they test in `__tests__/` directories

### Best Practices

- Write self-documenting code with clear names
- Add comments for complex logic or business rules
- Avoid premature optimization
- Handle errors gracefully
- Use async/await instead of promise chains
- Validate user input on both client and server
- Never commit sensitive data (API keys, passwords, etc.)

## Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification. See [docs/COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md) for details.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates, etc.

### Examples

```
feat: add QR code customization options

fix: resolve authentication redirect loop

docs: update API documentation for link endpoints

test: add tests for password reset flow
```

## Pull Request Process

1. **Update documentation** if needed (README, API docs, etc.)
2. **Add tests** for new functionality
3. **Ensure all tests pass** and coverage doesn't decrease
4. **Update CHANGELOG.md** if applicable
5. **Fill out the PR template** completely
6. **Request review** from maintainers
7. **Address review feedback** promptly
8. **Squash commits** if requested before merging

### PR Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Testing

We use Jest for testing. See [docs/TESTING.md](docs/TESTING.md) for detailed testing guidelines.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features and bug fixes
- Aim for high test coverage (minimum 70%)
- Test both happy paths and edge cases
- Use descriptive test names that explain what is being tested
- Mock external dependencies appropriately
- Keep tests focused and independent

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = setupTestData();
    
    // Act
    const result = performAction(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

## Questions?

If you have questions or need help, feel free to:

- Open an issue with your question
- Start a discussion on GitHub Discussions (if enabled)
- Reach out to the maintainers

## Recognition

Contributors will be recognized in:

- GitHub's built-in contributors page
- Project README (for significant contributions)
- Release notes (for features and fixes)

Thank you for contributing to UPer.li! 🎉
