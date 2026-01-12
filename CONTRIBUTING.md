# Contributing to Understate

First off, thank you for considering contributing to Understate! It's people like you that make Understate such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. Please be kind and constructive in all interactions.

## Getting Started

Before you begin:
- Check if the issue or feature has already been reported/requested
- Read through the [documentation](./readme.md) to understand the project
- Make sure you have Node.js installed (check `package.json` for version requirements)

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code samples, test cases)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (Node.js version, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the proposed feature
- **Explain why this enhancement would be useful**
- **Provide examples** of how the feature would be used

### Your First Code Contribution

Unsure where to begin? Look for issues tagged with:
- `good first issue` - Simple issues for newcomers
- `help wanted` - Issues that need attention

### Pull Requests

Pull requests are the best way to propose changes:

1. Fork the repo and create your branch from `master`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write clear commit messages
6. Update documentation as needed

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/understate.git
cd understate

# Install dependencies
npm install

# Run tests
npm test

# Build (if applicable)
npm run compile
```

## Coding Standards

### JavaScript Style

- Use clear, descriptive variable and function names
- Write comments for complex logic
- Follow the existing code style in the project
- Use ES6+ features where appropriate

### Mutators

When writing mutator functions:
- **Keep them pure** - no side effects
- **Maintain immutability** - return new objects, don't modify inputs
- **Document their behavior** - use JSDoc comments
- **Handle edge cases** - validate inputs when necessary

Example:
```javascript
/**
 * Increments a numeric value by a specified amount
 * @param {number} amount - The amount to increment by
 * @returns {Function} A mutator that increments the state
 */
const increment = (amount) => (state) => state + amount;
```

### Testing

- Write tests for new features
- Ensure existing tests still pass
- Test edge cases and error conditions
- Use descriptive test names

## Commit Guidelines

Write clear, concise commit messages:

### Format
```
type: Brief description (50 chars or less)

More detailed explanation if needed (wrap at 72 chars)

- Bullet points are okay
- Use present tense: "Add feature" not "Added feature"
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat: Add support for async mutators

fix: Prevent memory leak in subscription cleanup

docs: Update API reference for state.get() method

test: Add tests for indexation feature
```

## Pull Request Process

1. **Update documentation** - If your changes affect the API or usage
2. **Add tests** - Ensure your code is tested
3. **Update CHANGELOG.md** - Add your changes under "Unreleased"
4. **Ensure tests pass** - Run `npm test` before submitting
5. **Write a clear PR description** - Explain what and why
6. **Link related issues** - Use "Closes #123" if applicable
7. **Be responsive** - Address review feedback promptly

### PR Description Template

```markdown
## Description
Brief summary of changes

## Motivation
Why is this change needed?

## Changes Made
- List of specific changes
- With bullet points

## Testing
How was this tested?

## Related Issues
Closes #123
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🎉
