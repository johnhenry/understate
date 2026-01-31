# Understate

A simple, elegant state manager for JavaScript applications.

## Overview

Understate is a lightweight state management library inspired by Redux, designed with functional programming principles. It provides a clean API for managing application state using pure functions (mutators) to transform state over time.

Key features:
- **Simple API**: Create state instances, apply mutations, and subscribe to changes
- **Functional Design**: Uses pure mutator functions and higher-order function patterns
- **State Indexing**: Track and retrieve historical state snapshots by ID
- **Async Support**: Built-in support for asynchronous state mutations
- **Zero Dependencies**: Lightweight with no external dependencies
- **Framework Agnostic**: Works with React, Vue, vanilla JS, Node.js, or any JavaScript environment

## Installation

Install Understate via npm, yarn, or pnpm:

```bash
# Using npm
npm install understate

# Using yarn
yarn add understate

# Using pnpm
pnpm add understate
```

### Requirements

- Node.js or a browser environment
- ECMAScript 6 (ES2015) or later
- No additional dependencies required

## Usage

### Basic Example

```javascript
import Understate from 'understate';

// Create a new state instance with an initial value
const counter = new Understate({ initial: 0 });

// Subscribe to state changes
counter.subscribe(value => {
  console.log('Counter:', value);
});

// Define mutator functions
const increment = x => x + 1;
const decrement = x => x - 1;
const add = amount => x => x + amount;

// Update the state
counter.set(increment);    // Logs: "Counter: 1"
counter.set(add(5));       // Logs: "Counter: 6"
counter.set(decrement);    // Logs: "Counter: 5"

// Get the current state
counter.get().then(value => console.log('Current:', value)); // 5
```

For more comprehensive examples showcasing all library features, see [examples/comprehensive-demo.js](./examples/comprehensive-demo.js).

### Using with Async Operations

```javascript
import Understate from 'understate';

// Create async state instance
const dataState = new Understate({
  initial: { data: null, loading: false, error: null },
  asynchronous: true
});

// Async mutator for fetching data
const fetchUser = userId => async state => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const user = await response.json();
    return { user, loading: false, error: null };
  } catch (error) {
    return { user: null, loading: false, error: error.message };
  }
};

// Subscribe to state changes
dataState.subscribe(state => {
  if (state.loading) console.log('Loading...');
  else if (state.error) console.error('Error:', state.error);
  else if (state.user) console.log('User:', state.user);
});

// Fetch user data
dataState.set(fetchUser(123));
```

### State Indexing for History Tracking

```javascript
import Understate from 'understate';

// Create state with indexing enabled
const state = new Understate({ initial: 0, index: true });

const history = [];

// Track state IDs
state.subscribe((value, id) => {
  if (id) {
    history.push(id);
    console.log(`State ${value} saved with ID: ${id}`);
  }
});

const increment = x => x + 1;

// Make changes
state.set(increment); // State 1 saved with ID: <id1>
state.set(increment); // State 2 saved with ID: <id2>
state.set(increment); // State 3 saved with ID: <id3>

// Retrieve historical state
state.get(history[0]).then(value => {
  console.log('First state:', value); // 1
});
```

### Unsubscribing from Updates

```javascript
import Understate from 'understate';

const state = new Understate({ initial: 0 });
const increment = x => x + 1;

// Create subscription
const subscription = state.subscribe(value => {
  console.log('Value:', value);
});

state.set(increment); // Logs: "Value: 1"
state.set(increment); // Logs: "Value: 2"

// Unsubscribe
subscription.unsubscribe();

state.set(increment); // Nothing logged
```

## API Documentation

For complete API documentation, examples, and advanced usage patterns, see the [full documentation](./readme.md).

### Core Methods

- `new Understate(config)` - Create a new state instance
- `state.set(mutator, options)` - Update state using a mutator function
- `state.get(id)` - Retrieve current or historical state
- `state.subscribe(callback)` - Subscribe to state changes
- `subscription.unsubscribe()` - Cancel a subscription
- `state.id(shouldIndex)` - Get the current state ID

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Testing requirements
- Pull request process

### Quick Start for Contributors

```bash
# Clone the repository
git clone https://github.com/johnhenry/understate.git
cd understate

# Install dependencies
npm install

# Run tests
npm test
```

## License

ISC License - see [LICENSE](./LICENSE) for details.

---

Made with ❤️ by [John Henry](https://github.com/johnhenry)

[npm](https://www.npmjs.com/package/understate) • [GitHub](https://github.com/johnhenry/understate) • [Issues](https://github.com/johnhenry/understate/issues)

<!-- Updated: 2026-01-29 -->
