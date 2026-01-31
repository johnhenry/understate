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

#### Formatting Rules

- **Indentation**: Use 2 spaces for indentation (no tabs)
- **Semicolons**: Always use semicolons to terminate statements
- **Quotes**: Use single quotes `'` for strings, except when avoiding escaping
- **Line Length**: Keep lines under 100 characters; break long statements across multiple lines
- **Spacing**:
  - Add space after keywords: `if (condition)`, `for (let i = 0)`
  - Add space around operators: `x + y`, `a === b`
  - No space before function parentheses in declarations: `function foo()`
  - Add space after commas: `[1, 2, 3]`, `{a: 1, b: 2}`

#### Naming Conventions

- **Variables and Functions**: Use camelCase (`getUserData`, `isValid`)
- **Constants**: Use UPPER_SNAKE_CASE for true constants (`MAX_SIZE`, `DEFAULT_TIMEOUT`)
- **Classes**: Use PascalCase (`StateManager`, `DataProcessor`)
- **Private Members**: Prefix with underscore (`_internalState`, `_processData`)
- **Boolean Variables**: Use descriptive prefixes (`isLoading`, `hasError`, `canSubmit`)
- **Use descriptive names**: Avoid single-letter variables except in short loops or callbacks

#### ES6+ Best Practices

- **Arrow Functions**: Use arrow functions for anonymous functions and when you need lexical `this`
  ```javascript
  const double = (x) => x * 2;
  array.map((item) => item.value);
  ```
- **Destructuring**: Use destructuring for extracting object properties and array elements
  ```javascript
  const {name, age} = user;
  const [first, second] = array;
  ```
- **Template Literals**: Use template literals for string interpolation
  ```javascript
  const message = `Hello, ${name}!`;
  ```
- **Default Parameters**: Use default parameter values instead of manual checks
  ```javascript
  function greet(name = 'Guest') { }
  ```
- **Spread Operator**: Use spread for copying arrays/objects and merging
  ```javascript
  const newArray = [...oldArray, newItem];
  const merged = {...defaults, ...options};
  ```
- **const/let**: Use `const` by default; use `let` only when reassignment is needed; never use `var`
- **Async/Await**: Prefer async/await over raw promises for better readability
  ```javascript
  async function fetchData() {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      handleError(error);
    }
  }
  ```

#### General Guidelines

- Use clear, descriptive variable and function names
- Write comments for complex logic, but prefer self-documenting code
- Follow the existing code style in the project
- Keep functions small and focused on a single responsibility

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

Write clear, concise commit messages that explain **what** changed and **why**.

### Format
```
type(scope): Brief description (50 chars or less)

More detailed explanation if needed (wrap at 72 chars).
Explain the problem this commit solves and why you chose
this approach if it's not obvious.

- Bullet points are okay for listing multiple changes
- Use present tense: "Add feature" not "Added feature"
- Reference issues: "Fixes #123" or "Related to #456"
```

### Types
- `feat`: New feature for the user or new capability
- `fix`: Bug fix that resolves incorrect behavior
- `docs`: Documentation changes (README, CONTRIBUTING, JSDoc, etc.)
- `style`: Code style changes (formatting, missing semicolons, whitespace)
- `refactor`: Code refactoring without changing external behavior
- `test`: Adding missing tests or correcting existing tests
- `chore`: Maintenance tasks (dependency updates, build config, etc.)
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes

### Scope (Optional)

The scope specifies what part of the codebase is affected:
- `feat(mutators)`: Add compose helper for chaining mutators
- `fix(state)`: Resolve race condition in subscription updates
- `docs(api)`: Clarify return types in API documentation
- `test(validation)`: Add edge case tests for input validation

### Examples

#### Good Commits
```
feat: Add support for async mutators

Allows mutators to return promises for asynchronous state updates.
This enables integration with async data sources.

Closes #42

fix: Prevent memory leak in subscription cleanup

Subscriptions were not being properly removed when components
unmounted, causing references to persist. Now properly cleans
up all event listeners on unsubscribe.

Fixes #89

docs: Update API reference for state.get() method

Clarifies that get() returns undefined for non-existent keys
rather than throwing an error.

test(mutators): Add edge case tests for null and undefined values

refactor(core): Extract validation logic into separate module

Improves code organization and makes validation reusable across
the codebase. No behavioral changes.

chore: Update dependencies to latest versions

Updates dev dependencies to resolve security vulnerabilities
reported by npm audit.
```

#### Edge Cases and Special Scenarios

**Breaking Changes**: Use `BREAKING CHANGE:` in the footer
```
feat!: Change mutator API to return immutable proxies

BREAKING CHANGE: Mutators now return ES6 proxies instead of
plain objects. Code that relies on Object.keys() or JSON.stringify()
on mutator results will need to be updated.

Migration guide added to docs/migration.md
```

**Multiple Changes**: List all changes if they're related
```
feat(validation): Add comprehensive input validation

- Add type checking for all public API methods
- Throw TypeError for invalid arguments
- Add validation helpers for common patterns
- Update documentation with validation rules

Closes #12, #34, #56
```

**Reverting Commits**: Reference the reverted commit
```
revert: Revert "feat: Add experimental caching layer"

This reverts commit abc123def456.

The caching implementation caused issues with state consistency
in concurrent updates. Will revisit with a different approach.

Reopens #78
```

**Work in Progress**: Use WIP prefix (avoid on main branch)
```
WIP: Implement draft of subscription batching

Not ready for review. Still debugging edge cases with nested updates.
```

### Common Mistakes to Avoid

❌ **Too vague**: `fix: Fix bug`
✅ **Specific**: `fix: Prevent null pointer when state is undefined`

❌ **Multiple unrelated changes**: `feat: Add feature X, fix bug Y, update docs`
✅ **Separate commits**: Create individual commits for each logical change

❌ **Past tense**: `feat: Added new feature`
✅ **Present tense**: `feat: Add new feature`

❌ **No context**: `refactor: Update code`
✅ **With context**: `refactor(parser): Simplify tokenization logic`

## Pull Request Process

### Before Creating a Pull Request

1. **Create a Feature Branch**: Follow branch naming conventions
   - Feature: `feature/description-of-feature` or `feat/add-async-support`
   - Bug fix: `fix/description-of-bug` or `bugfix/memory-leak-subscriptions`
   - Documentation: `docs/update-api-reference`
   - Refactor: `refactor/simplify-validation`
   - Example: `feature/async-mutators`, `fix/null-pointer-state`

2. **Keep Changes Focused**: One PR should address one feature/fix
   - Avoid mixing unrelated changes
   - Split large changes into smaller, reviewable PRs
   - Each PR should have a clear, singular purpose

3. **Ensure Code Quality**:
   - Run `npm test` to verify all tests pass
   - Run linter if configured: `npm run lint`
   - Build successfully: `npm run compile`
   - Test manually in a real-world scenario
   - Check code coverage hasn't decreased

4. **Update Documentation**:
   - Update README.md if adding/changing features
   - Add/update JSDoc comments for public APIs
   - Update CHANGELOG.md under "Unreleased" section
   - Add examples if introducing new functionality

5. **Write/Update Tests**:
   - Add tests for new features
   - Add regression tests for bug fixes
   - Ensure edge cases are covered
   - Maintain or improve code coverage

### Creating the Pull Request

1. **Push Your Branch**: Push to your fork or the main repository
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open the PR**: Use a clear, descriptive title
   - Good: `feat: Add async mutator support with Promise handling`
   - Good: `fix: Resolve memory leak in subscription cleanup`
   - Bad: `Update code`
   - Bad: `Fixes stuff`

3. **Fill Out the PR Template**: Provide comprehensive information

### PR Description Template

```markdown
## Description
Brief summary of what this PR does (2-3 sentences)

## Motivation and Context
Why is this change needed? What problem does it solve?
Link to related issues or discussions.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement

## Changes Made
Detailed list of changes:
- Added X functionality to handle Y
- Modified Z to improve performance
- Removed deprecated W method
- Updated documentation for V

## Testing
How has this been tested? Provide test cases:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Test coverage maintained or improved

### Test Scenarios
1. Scenario: What you tested
   - Steps: How to reproduce
   - Expected: What should happen
   - Actual: What happened

## Breaking Changes
If this is a breaking change, describe:
- What breaks
- Migration path for users
- Why the breaking change is necessary

## Screenshots (if applicable)
Add screenshots for UI changes or visual updates

## Checklist
- [ ] My code follows the coding standards of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
- [ ] I have updated the CHANGELOG.md

## Related Issues
Closes #123
Fixes #456
Related to #789
```

### Code Review Expectations

#### For PR Authors:

1. **Be Responsive**:
   - Respond to review comments within 48 hours
   - Ask for clarification if feedback is unclear
   - Update the PR promptly based on feedback

2. **Accept Feedback Gracefully**:
   - Code reviews are about improving code quality, not personal criticism
   - Consider all suggestions thoughtfully
   - Explain your reasoning if you disagree with feedback
   - Be willing to iterate on your approach

3. **Keep the PR Updated**:
   - Rebase on master if conflicts arise
   - Mark conversations as resolved when addressed
   - Add comments explaining significant changes after review
   - Request re-review after making substantial changes

#### For Reviewers:

1. **Review Promptly**: Try to review within 48 hours
2. **Be Constructive**: Explain *why* changes are needed
3. **Distinguish Between**:
   - **Blocking issues**: Must be fixed (bugs, security, breaking changes)
   - **Suggestions**: Nice-to-have improvements (style, optimization)
4. **Test the Changes**: Pull the branch and verify locally when possible

### Merge Requirements

A PR can be merged when:

1. **Approvals**: At least one approving review from a maintainer
2. **CI Passes**: All automated checks are green
   - Tests pass
   - Linting passes
   - Build succeeds
3. **Conflicts Resolved**: No merge conflicts with base branch
4. **Reviews Addressed**: All review comments resolved or discussed
5. **Documentation Updated**: README, CHANGELOG, and relevant docs updated

### Merge Process

1. **Squash and Merge** (default): For feature branches with many commits
   - Combines all commits into one
   - Edit the commit message to be descriptive
   - Remove "WIP", "fixup", and other temporary commit messages

2. **Rebase and Merge**: For clean commit histories
   - Use when commits are well-structured and meaningful
   - Each commit should be logical and pass tests

3. **Merge Commit**: Rarely used
   - Only for merging long-lived branches
   - Preserves complete history

### After Merge

1. **Delete the Branch**: Clean up merged feature branches
2. **Close Related Issues**: Ensure linked issues are closed
3. **Update Dependents**: If this affects other projects, notify them
4. **Monitor**: Watch for any issues reported after merge

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🎉
