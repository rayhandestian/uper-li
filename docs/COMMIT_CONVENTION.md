# Commit Convention

This project follows the [Conventional Commits](https://conventionalcommits.org/) specification.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

## Examples

- `feat: add user registration`
- `fix: resolve login issue`
- `docs: update README`
- `refactor: simplify auth logic`

## Breaking Changes

For breaking changes, add `!` after the type/scope and describe in the footer:

```
feat!: change API endpoint

BREAKING CHANGE: The API endpoint has changed from /api/v1 to /api/v2