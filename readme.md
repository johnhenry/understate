<div align="center">

# Understate

**A simple, elegant state manager**

[![npm version](https://img.shields.io/npm/v/understate.svg?style=flat-square)](https://www.npmjs.com/package/understate)
[![license](https://img.shields.io/npm/l/understate.svg?style=flat-square)](https://github.com/johnhenry/understate/blob/master/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/understate.svg?style=flat-square)](https://www.npmjs.com/package/understate)
[![bundle size](https://img.shields.io/bundlephobia/minzip/understate.svg?style=flat-square)](https://bundlephobia.com/package/understate)

</div>

---

## Overview

Understate is a lightweight, functional state manager inspired by [Redux](https://github.com/rackt/redux/). It uses higher-order functions and pure mutators to manage application state, with built-in support for state indexing, time-travel debugging, and asynchronous operations.

**Key Features:**
- **Functional & Pure**: State updates through pure mutator functions
- **Flexible**: No enforced immutability, but designed to work beautifully with immutable patterns
- **Powerful**: Built-in state indexing for undo/redo and time-travel debugging
- **Async-Ready**: First-class support for asynchronous state updates
- **Lightweight**: Zero dependencies, minimal API surface
- **Framework Agnostic**: Works with React, Vue, Node.js, or vanilla JavaScript

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Your First State Manager](#your-first-state-manager)
  - [Common Use Cases](#common-use-cases)
  - [Integration Examples](#integration-examples)
  - [Quick Tips](#quick-tips)
- [Core Concepts](#core-concepts)
  - [Basic Usage](#basic-usage)
  - [Mutators](#mutators)
  - [Builders](#builders)
  - [Routers](#routers)
  - [Indexation](#indexation)
  - [Asynchronous Mutators](#asynchronous-mutators)
- [Advanced Patterns](#advanced-usage-patterns)
- [API Reference](#api-reference)
- [Redux Comparison](#redux-comparison)

## Installation

Install Understate using your preferred package manager:

**npm:**
```bash
npm install understate
```

**yarn:**
```bash
yarn add understate
```

**pnpm:**
```bash
pnpm add understate
```

### Requirements

- Node.js or a browser environment
- ECMAScript 6 (ES2015) or later
- No additional dependencies required

### Importing

**ES6 Modules:**
```javascript
import Understate from 'understate';
```

**CommonJS:**
```javascript
const Understate = require('understate');
```

**TypeScript:**
```typescript
import Understate from 'understate';
// Note: TypeScript definitions are inferred from the JavaScript implementation
```

## Quick Start

### Your First State Manager

Here's the simplest way to get started with Understate in just 3 steps:

```javascript
import Understate from 'understate';

// Step 1: Create a new state instance with an initial value
const state = new Understate({ initial: 0 });

// Step 2: Subscribe to state changes (optional, but useful for debugging)
state.subscribe(value => console.log('State updated:', value));

// Step 3: Update the state using a mutator function
const increment = x => x + 1;

state.set(increment); // Logs: "State updated: 1"
state.set(increment); // Logs: "State updated: 2"

// Get the current state
state.get().then(value => console.log('Current state:', value)); // 2
```

### Common Use Cases

#### Example 1: Simple Counter

A basic counter demonstrating core concepts:

```javascript
import Understate from 'understate';

// Create a counter starting at 0
const counter = new Understate({ initial: 0 });

// Watch for changes
counter.subscribe(value => {
  console.log('Counter:', value);
  // Update your UI here
  document.getElementById('count').textContent = value;
});

// Define operations
const increment = x => x + 1;
const decrement = x => x - 1;
const add = amount => x => x + amount;
const reset = () => 0;

// Use the counter
counter.set(increment);    // Counter: 1
counter.set(add(5));       // Counter: 6
counter.set(decrement);    // Counter: 5
counter.set(reset);        // Counter: 0
```

#### Example 2: Todo List Manager

Managing complex state with arrays and objects:

```javascript
import Understate from 'understate';

// Mutator builders for todo operations
const addTodo = text => todos => [
  ...todos,
  { id: Date.now(), text, completed: false }
];

const toggleTodo = id => todos =>
  todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

const removeTodo = id => todos =>
  todos.filter(todo => todo.id !== id);

const clearCompleted = () => todos =>
  todos.filter(todo => !todo.completed);

// Create the todo list state
const todoList = new Understate({ initial: [] });

// Subscribe to updates
todoList.subscribe(todos => {
  console.log(`Total todos: ${todos.length}`);
  console.log(`Completed: ${todos.filter(t => t.completed).length}`);
  // Render your todo list UI here
});

// Use it
todoList.set(addTodo('Learn Understate'));
todoList.set(addTodo('Build an app'));
todoList.set(toggleTodo(1)); // Mark first todo as complete
```

#### Example 3: Form State Management

Managing form data and validation:

```javascript
import Understate from 'understate';

// Form mutator builders
const updateField = (field, value) => state => ({
  ...state,
  [field]: value,
  errors: { ...state.errors, [field]: null } // Clear error on change
});

const setError = (field, message) => state => ({
  ...state,
  errors: { ...state.errors, [field]: message }
});

const resetForm = initialValues => () => ({
  ...initialValues,
  errors: {}
});

// Create form state
const formState = new Understate({
  initial: {
    email: '',
    password: '',
    errors: {}
  }
});

// Subscribe to form changes
formState.subscribe(state => {
  console.log('Form state:', state);
  // Update form UI, enable/disable submit button, etc.
});

// Use it
formState.set(updateField('email', 'user@example.com'));
formState.set(updateField('password', 'secret123'));

// Validation
formState.get().then(state => {
  if (!state.email.includes('@')) {
    formState.set(setError('email', 'Invalid email address'));
  }
});
```

#### Example 4: Async Data Fetching

Handle asynchronous operations with loading states:

```javascript
import Understate from 'understate';

// Async mutator for fetching user data
const fetchUser = userId => async currentState => {
  // Set loading state
  const loadingState = { ...currentState, loading: true, error: null };

  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');

    const user = await response.json();
    return {
      user,
      loading: false,
      error: null
    };
  } catch (error) {
    return {
      user: null,
      loading: false,
      error: error.message
    };
  }
};

// Create async state
const userState = new Understate({
  initial: { user: null, loading: false, error: null },
  asynchronous: true
});

// Subscribe to state changes
userState.subscribe(state => {
  if (state.loading) {
    console.log('Loading user...');
  } else if (state.error) {
    console.error('Error:', state.error);
  } else if (state.user) {
    console.log('User loaded:', state.user.name);
  }
});

// Fetch user
userState.set(fetchUser(123));
```

#### Example 5: Undo/Redo with History

Track state history for time-travel functionality:

```javascript
import Understate from 'understate';

// Create state with indexing enabled
const editorState = new Understate({
  initial: '',
  index: true  // Enable automatic state indexing
});

const history = [];
let historyIndex = -1;

// Track all state changes
editorState.subscribe((content, id) => {
  if (id && historyIndex === history.length - 1) {
    // New change - add to history
    history.push(id);
    historyIndex++;
    console.log('Content:', content);
    console.log(`History: ${historyIndex + 1}/${history.length}`);
  }
});

// Mutators
const updateContent = newContent => () => newContent;

// Undo function
const undo = () => {
  if (historyIndex > 0) {
    historyIndex--;
    return editorState.get(history[historyIndex]);
  }
  return Promise.reject(new Error('Nothing to undo'));
};

// Redo function
const redo = () => {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    return editorState.get(history[historyIndex]);
  }
  return Promise.reject(new Error('Nothing to redo'));
};

// Usage
editorState.set(updateContent('Hello'));
editorState.set(updateContent('Hello World'));
editorState.set(updateContent('Hello World!'));

// Now you can undo/redo
undo().then(content => console.log('Undo:', content)); // "Hello World"
redo().then(content => console.log('Redo:', content)); // "Hello World!"
```

### Integration Examples

#### Using with React

```javascript
import { useState, useEffect } from 'react';
import Understate from 'understate';

// Create state outside component
const counterState = new Understate({ initial: 0 });

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Subscribe to state changes
    const subscription = counterState.subscribe(value => {
      setCount(value);
    });

    // Get initial state
    counterState.get().then(setCount);

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counterState.set(x => x + 1)}>
        Increment
      </button>
    </div>
  );
}
```

#### Using with Vue

```javascript
import { ref, onMounted, onUnmounted } from 'vue';
import Understate from 'understate';

export default {
  setup() {
    const count = ref(0);
    const counterState = new Understate({ initial: 0 });
    let subscription;

    onMounted(() => {
      subscription = counterState.subscribe(value => {
        count.value = value;
      });
      counterState.get().then(value => count.value = value);
    });

    onUnmounted(() => {
      subscription.unsubscribe();
    });

    const increment = () => counterState.set(x => x + 1);

    return { count, increment };
  }
};
```

#### Using in Node.js

```javascript
// server.js
import Understate from 'understate';

// Track server metrics
const metrics = new Understate({
  initial: { requests: 0, errors: 0, uptime: Date.now() }
});

// Log metrics changes
metrics.subscribe(state => {
  console.log('Metrics updated:', state);
});

// Update on each request
app.use((req, res, next) => {
  metrics.set(state => ({
    ...state,
    requests: state.requests + 1
  }));
  next();
});

// Update on errors
app.use((err, req, res, next) => {
  metrics.set(state => ({
    ...state,
    errors: state.errors + 1
  }));
  next(err);
});
```

### Quick Tips

**1. Write Pure Mutators**
```javascript
// Good: Pure function, returns new state
const goodMutator = state => ({ ...state, count: state.count + 1 });

// Bad: Mutates original state
const badMutator = state => {
  state.count += 1; // Don't do this!
  return state;
};
```

**2. Use Builder Pattern for Reusability**
```javascript
// Create reusable mutator factories
const updateField = (field, value) => state => ({
  ...state,
  [field]: value
});

// Use the builder
state.set(updateField('name', 'John'));
state.set(updateField('age', 30));
```

**3. Always Clean Up Subscriptions**
```javascript
// Store the subscription
const subscription = state.subscribe(value => {
  console.log(value);
});

// Clean up when done (important in components!)
subscription.unsubscribe();
```

**4. Use Async/Await for Better Readability**
```javascript
// Instead of this:
state.get().then(value => console.log(value));

// You can use:
const value = await state.get();
console.log(value);
```

**5. Leverage Indexing for Complex Features**
```javascript
// Enable indexing for undo/redo, time-travel debugging, etc.
const state = new Understate({
  initial: data,
  index: true  // Automatically track state history
});
```

### Next Steps

- **Learn the Basics**: Read the [Core Concepts](#core-concepts) section for detailed explanations
- **Understand Mutators**: Explore [Mutators](#mutators) and [Builders](#builders) for advanced patterns
- **Handle Complex Logic**: Check out [Routers](#routers) for action dispatching
- **Work with Async**: See [Async Mutators](#asynchronous-mutators) for async operations
- **Master Advanced Patterns**: Review [Advanced Usage Patterns](#advanced-usage-patterns)
- **API Reference**: Consult the [API Reference](#api-reference) for complete method documentation

## Core Concepts

### Basic Usage

When you first create an Understate object, it has an initial internal state that can be accessed via the "get" method.

```javascript
import Understate from 'understate';

/**
 * Simple logger utility
 * @param {*} value - The value to log
 * @returns {void}
 */
const log = (value) => console.log(value);

// Create new state instance
const state = new Understate();

// Get initial state (undefined by default)
state.get()
  .then(log) // undefined
  .catch((error) => console.error('Error getting state:', error));
```

You can also pass an initial value when creating an Understate object.

```javascript
/**
 * Create state with initial value
 * @type {Understate}
 */
const state = new Understate({ initial: 0 });

state.get()
  .then(log) // 0
  .catch((error) => console.error('Error getting state:', error));
```

You can update the internal value by passing a **mutator** (See Below) function to the "set" method.

```javascript
/**
 * Increment mutator - adds 1 to current state
 * @param {number} x - Current state value
 * @returns {number} Incremented value
 */
const increment = (x) => x + 1;

const state = new Understate({ initial: 0 });

// Get initial state
state.get()
  .then(log) // 0
  .catch((error) => console.error('Error:', error));

// Set new state using mutator
state.set(increment)
  .then(log) // 1
  .catch((error) => console.error('Error setting state:', error));
```

You can subscribe to updates with the **"subscribe"** method.

```javascript
const state = new Understate({ initial: 0 });

// Subscribe to all state changes
state.subscribe(log);

// Each set operation will trigger the subscriber
state.set(increment)
  .catch((error) => console.error('Error:', error)); // Logs: 1

state.set(increment)
  .catch((error) => console.error('Error:', error)); // Logs: 2

state.set(increment)
  .catch((error) => console.error('Error:', error)); // Logs: 3
```

You can unsubscribe to updates by calling the **"unsubscribe"** method on the object returned by the subscribe method.

```javascript
const state = new Understate({ initial: 0 });
const unsubscriber = state.subscribe(log);

state.set(increment)
  .catch((error) => console.error('Error:', error)); // Logs: 1

state.set(increment)
  .catch((error) => console.error('Error:', error)); // Logs: 2

// Unsubscribe from further updates
unsubscriber.unsubscribe();

state.set(increment)
  .catch((error) => console.error('Error:', error)); // Nothing logged
```

### Mutators

**Mutator** functions should be pure functions (they have no side effects) that take in a state and return an updated copy of that state without modifying the original (they respect immutability). With that said, these ideas are pretty much programmatically unenforceable, so if you wish to follow this convention, you'll have to take special care to enforce these properties upon your code yourself.

#### Signature

A **mutator** should have the following function signature:

```javascript
/**
 * Mutator function signature
 * @param {*} state - The current state
 * @returns {*} The new state (should be a new reference for immutability)
 */
(state) => {
  /* some combination of closure and "state" */
  return newState;
};
```

#### Example

This mutator returns the state incremented by 1

```javascript
/**
 * Increment mutator - pure function that increments a number
 * @param {number} state - Current numeric state
 * @returns {number} State incremented by 1
 */
const increment = (state) => state + 1;
```

### Builders

Since a **mutator** function only takes in a state, any modifications that are made to it must be based on its closure.

We can take advantage of this by creating mutation **builder** functions that takes, as arguments, a set of parameters and return **mutators** that use the parameters in its closure.

#### Signature

A **builder** function should have the following function signature:

```javascript
/**
 * Builder function signature - creates mutators with closure
 * @param {...*} parameters - Parameters to close over
 * @returns {Function} A mutator function
 */
(...parameters) => (state) => {
  /* some combination of closure, "parameters", and "state" */
  return newState;
};
// OR
(...parameters) => /* <Mutator> */;
```

#### Example

```javascript
/**
 * Adder builder - creates mutators that add a specific value
 * @param {number} y - The value to add
 * @returns {Function} A mutator that adds y to the state
 */
const adder = (y) => (x) => x + y;

// Create a specific mutator
const increment = adder(1);

// This is equivalent to the increment function defined above
// adder(y) = y => x => x + y;
// adder(1) = x => x + 1;
```

#### Initialization with Constant Function Builders

It's often useful to set a state rather than modify it. In this case, we can use a function that returns a constant.

```javascript
/**
 * Constant mutator that always returns 1
 * @param {*} _ - Current state (ignored)
 * @returns {number} Always returns 1
 */
const one = (_) => 1;

const state = new Understate();
state.subscribe(log);

state.set(one)
  .catch((error) => console.error('Error:', error)); // 1

state.set(one)
  .catch((error) => console.error('Error:', error)); // 1

state.set(one)
  .catch((error) => console.error('Error:', error)); // 1
```

We can create constant function **builders** as well.

```javascript
/**
 * Constant builder - creates mutators that always return a specific value
 * @param {*} a - The constant value to return
 * @returns {Function} A mutator that always returns the constant value
 */
const constant = (a) => (_) => a;

// This is equivalent to "one" defined above
const one = constant(1);

const state = new Understate();
state.subscribe(log);

state.set(one)
  .catch((error) => console.error('Error:', error)); // 1

state.set(one)
  .catch((error) => console.error('Error:', error)); // 1

state.set(constant(1))
  .catch((error) => console.error('Error:', error)); // 1
```

#### Using Builders

Using different types of **builders** allows us to elegantly express how we modify an application's state.

```javascript
// CounterApplication.js
import Understate from 'understate';

/**
 * Logger utility
 * @param {*} value - Value to log
 */
const log = (value) => console.log(value);

// Builders
/**
 * Constant builder
 * @param {*} a - Constant value
 * @returns {Function} Mutator returning constant
 */
const constant = (a) => (_) => a;

/**
 * Adder builder
 * @param {number} a - Value to add
 * @returns {Function} Mutator that adds value
 */
const adder = (a) => (b) => b + a;

// Mutators
const zero = constant(0);
const increment = adder(1);

// App
const counter = new Understate();
counter.subscribe(log);

counter.set(zero)
  .catch((error) => console.error('Error:', error)); // 0

counter.set(increment)
  .catch((error) => console.error('Error:', error)); // 1

counter.set(adder(2))
  .catch((error) => console.error('Error:', error)); // 3
```

```javascript
// messageApplication.js
import Understate from 'understate';

/**
 * Logger utility
 * @param {*} value - Value to log
 */
const log = (value) => console.log(value);

// Builders
/**
 * Constant builder
 * @param {*} a - Constant value
 * @returns {Function} Mutator returning constant
 */
const constant = (a) => (_) => a;

/**
 * Add message builder - creates mutator that appends a message
 * @param {string} message - Message to append
 * @returns {Function} Mutator that appends message to array
 */
const addMessage = (message) => (messages) => messages.concat(message);

/**
 * Logger that returns the logged value
 * @param {*} message - Message to log
 * @returns {*} The same message
 */
const logger = (message) => {
  log(message);
  return message;
};

// Mutators
const empty = constant([]);

// App
const messages = new Understate();
messages.subscribe(log);

messages.set(empty)
  .catch((error) => console.error('Error:', error)); // []

messages.set(addMessage('Hello'))
  .catch((error) => console.error('Error:', error)); // ['Hello']

messages.set(addMessage('there'))
  .catch((error) => console.error('Error:', error)); // ['Hello', 'there']

messages.set(addMessage('John.'))
  .catch((error) => console.error('Error:', error)); // ['Hello', 'there', 'John.']
```

#### Decorators

Redux has a concept of _middleware_ used to intercept objects and perform actions such as logging.

Rather, we can simply design our **mutators** to perform these actions.

```javascript
// messageApplication.js
import Understate from 'understate';

/**
 * Receive logger - logs when message is received
 * @param {string} value - Message received
 * @returns {string} The message
 */
const receiveLog = (value) => {
  console.log(value + ' received.');
  return value;
};

// Builders
/**
 * Constant builder with logging
 * @param {*} a - Constant value
 * @returns {Function} Mutator with logging
 */
const constant = (a) => (_) => {
  console.log('Setting constant: ' + a);
  return a;
};

/**
 * Add message builder with logging
 * @param {string} message - Message to add
 * @returns {Function} Mutator that adds message with logging
 */
const addMessageLog = (message) => (messages) =>
  messages.concat(receiveLog(message));

// Mutators
const empty = constant([]);

// App
const messages = new Understate();

messages.set(empty)
  .catch((error) => console.error('Error:', error)); // 'Setting constant:'

messages.set(addMessageLog('Hello'))
  .catch((error) => console.error('Error:', error)); // 'Hello received.'

messages.set(addMessageLog('there'))
  .catch((error) => console.error('Error:', error)); // 'there received.'

messages.set(addMessageLog('John.'))
  .catch((error) => console.error('Error:', error)); // 'John. received.'
```

**Decorators** take in functions return similar functions with enhanced functionality. They should take a function as one of its arguments and return a function with the same signature. We apply them to **builder** functions.

```javascript
// messageApplication.js
import Understate from 'understate';

// Decorators
/**
 * Log input decorator - wraps a builder to log its inputs
 * @param {Function} target - The builder function to wrap
 * @param {string} [preamble=''] - Text to log before arguments
 * @param {string} [conclusion=''] - Text to log after arguments
 * @returns {Function} Wrapped builder with logging
 */
const logInput = (target = (_) => _, preamble = '', conclusion = '') =>
  (...args) => {
    console.log(preamble + String(args) + conclusion);
    return target.apply(this, args);
  };

// Builders
/**
 * Constant builder
 * @param {*} a - Constant value
 * @returns {Function} Mutator
 */
const constant = logInput((a) => (_) => a, 'Setting constant: ');

/**
 * Add message builder
 * @param {string} message - Message to add
 * @returns {Function} Mutator
 */
const addMessage = logInput(
  (message) => (messages) => messages.concat(message),
  '',
  ' received.'
);

// Mutators
const empty = constant([]);

// App
const messages = new Understate();

messages.set(empty)
  .catch((error) => console.error('Error:', error)); // 'Setting constant:'

messages.set(addMessage('Hello'))
  .catch((error) => console.error('Error:', error)); // 'Hello received.'

messages.set(addMessage('there'))
  .catch((error) => console.error('Error:', error)); // 'there received.'

messages.set(addMessage('John.'))
  .catch((error) => console.error('Error:', error)); // 'John. received.'
```

Note: ECMAScript 8 (2017) has a similar new language feature, also called "decorators", that work in a similar way, but can only be applied to class methods.

### Routers

The final piece of the puzzle is the **router**. Its job is to take "action" from another component in the application, and return a **mutator** function to be applied to the current state. It does this by selecting a **builder** based on an "action" and extracting parameters from that "action".

Strictly speaking, **routers** are **builders**, as they take in a parameter, "action", and return a **mutator** function. They are still; however, a useful abstraction when it comes to deciding how to handle updates.

#### Signature

A **router** should have the following signature:

```javascript
/**
 * Router function signature
 * @param {Object} action - Action object containing builder type and parameters
 * @returns {Function} A mutator function
 */
(action) => (state) => {
  /* some combination of closure, "action" parameters, and "state" */
  return newState;
};
// OR
(action) => /* <Mutator> */;
```


#### Example

This is an application that uses a sample router.

```javascript
// File: sampleRouters.js

/**
 * Action Schema (TypeScript-style documentation)
 * @typedef {Object} Action
 * @property {string} builder - The name of the builder to use
 * @property {number} parameter - The parameter to pass to the builder
 */

// Builders
/**
 * Add builder
 * @param {number} a - Value to add
 * @returns {Function} Mutator that adds value
 */
const add = (a) => (b) => b + a;

/**
 * Subtract builder
 * @param {number} a - Value to subtract
 * @returns {Function} Mutator that subtracts value
 */
const subtract = (a) => (b) => b - a;

/**
 * Reset builder
 * @param {number} a - Value to reset to
 * @returns {Function} Mutator that resets to value
 */
const reset = (a) => (_) => a;

/**
 * Extract the builder name from action
 * @param {Action} action - The action object
 * @returns {string} The builder name
 */
const extractSubject = (action) => {
  if (!action || typeof action.builder !== 'string') {
    throw new Error('Invalid action: missing builder property');
  }
  return action.builder;
};

/**
 * Extract parameters from action
 * @param {Action} action - The action object
 * @returns {*} The parameter value
 */
const extractParameters = (action) => {
  if (!action || action.parameter === undefined) {
    throw new Error('Invalid action: missing parameter property');
  }
  return action.parameter;
};

// Router Implementation: Dictionary (Map-based)
const builders = new Map();

// Available mutation builders
builders.set('add', add);
builders.set('subtract', subtract);
builders.set('reset', reset);

/**
 * Map-based router - uses Map to look up builders
 * @param {Action} action - The action to route
 * @returns {Function} The appropriate mutator function
 */
const mapRouter = (action) => {
  try {
    const subject = extractSubject(action);
    const parameters = extractParameters(action);
    const builder = builders.get(subject);

    if (!builder) {
      console.warn(`Unknown builder: ${subject}`);
      return (_) => _; // Identity function as fallback
    }

    return builder(parameters);
  } catch (error) {
    console.error('Router error:', error);
    return (_) => _; // Identity function on error
  }
};

// Router Implementation: Switch Statement
/**
 * Switch-based router - uses switch statement to select builders
 * @param {Action} action - The action to route
 * @returns {Function} The appropriate mutator function
 */
const switchRouter = (action) => {
  try {
    const subject = extractSubject(action);
    const parameters = extractParameters(action);
    let builder;

    switch (subject) {
      case 'add':
        builder = add;
        break;
      case 'subtract':
        builder = subtract;
        break;
      case 'reset':
        builder = reset;
        break;
      default:
        console.warn(`Unknown builder: ${subject}`);
        return (_) => _; // Identity function as fallback
    }

    return builder(parameters);
  } catch (error) {
    console.error('Router error:', error);
    return (_) => _; // Identity function on error
  }
};

export { mapRouter, switchRouter };
export default {
  mapRouter,
  switchRouter
};
```

```javascript
// File: application.js
import Understate from 'understate';
import { mapRouter as router } from './sampleRouters.js';

/**
 * Create state instance with initial value
 * @type {Understate}
 */
const state = new Understate({ initial: 0 });

// Subscribe to state changes
state.subscribe((currentState) => {
  console.log('State updated:', currentState);
});

/**
 * Update function - routes action through router to mutator
 * @param {Object} action - The action to process
 * @returns {Promise} Promise resolved with new state
 */
const update = (action) =>
  state.set(router(action))
    .catch((error) => {
      console.error('Update failed:', error);
      throw error;
    });

export default update;
```

```javascript
// runner.js
import update from './application.js';

/**
 * @type {Array<Action>}
 */
const actions = [
  {
    builder: 'add',
    parameter: 1
  },
  {
    builder: 'subtract',
    parameter: 2
  },
  {
    builder: 'reset',
    parameter: 0
  }
];

/**
 * Process all actions sequentially
 */
const processActions = async () => {
  try {
    for (const action of actions) {
      await update(action);
    }
  } catch (error) {
    console.error('Failed to process actions:', error);
  }
};

processActions();

// Output:
// State updated: 1
// State updated: -1
// State updated: 0
```

### Indexation

Understate objects track their state internally.

Each Understate object associates an id with its value whenever its value is updated. This can be accessed from the **"id"** method.

```javascript
const state = new Understate({ initial: 0 });

// Get current state ID
const initialId = state.id();
console.log(initialId); // *<ID>

state.set(increment)
  .then(() => {
    const newId = state.id();
    console.log(newId); // *<ID(Different)>
    console.log(initialId !== newId); // true
  })
  .catch((error) => console.error('Error:', error));
```

Passing a _truthy_ "index" config option to the **"set"** function will cause its id to be passed as a second argument to the function passed to subscribe.

```javascript
/**
 * Logger with ID - logs both value and state ID
 * @param {*} value - The state value
 * @param {string} [id] - The state ID (when indexing is enabled)
 * @returns {void}
 */
const logId = (value, id) => {
  if (id) {
    console.log(`${id}:${value}`);
  } else {
    console.log(value);
  }
};

const state = new Understate({ initial: 0 });
state.subscribe(logId);

state.set(increment, { index: true })
  .catch((error) => console.error('Error:', error)); // *<ID>:1

state.set(increment, { index: true })
  .catch((error) => console.error('Error:', error)); // *<ID>:2

state.set(increment, { index: true })
  .catch((error) => console.error('Error:', error)); // *<ID>:3
```

Passing a _truthy_ "index" config option to the **"set"** function will also cause the Understate object to internally index its state by id. This id can later be used to access any indexed states by passing it to the **"get"** method.

```javascript
const state = new Understate({ initial: 0 });

state.subscribe((value, id) => {
  // Retrieve historical state after delay
  setTimeout(() => {
    state.get(id)
      .then(log)
      .catch((error) => console.error('Error retrieving state:', error));
  }, 5000);
});

state.set(increment, { index: true })
  .catch((error) => console.error('Error:', error)); // Logs: 1 (After 5 seconds)

state.set(increment, { index: true })
  .catch((error) => console.error('Error:', error)); // Logs: 2 (After 5 seconds)

state.set(increment, { index: true })
  .catch((error) => console.error('Error:', error)); // Logs: 3 (After 5 seconds)
```

Passing a _truthy_ index option to the constructor will cause the set function to automatically index values.

```javascript
const state = new Understate({ initial: 0, index: true });
state.subscribe(logId);

// Automatically indexed
state.set(increment)
  .catch((error) => console.error('Error:', error)); // *<ID>:1

state.set(increment)
  .catch((error) => console.error('Error:', error)); // *<ID>:2

// Override auto-indexing for this call
state.set(increment, { index: false })
  .catch((error) => console.error('Error:', error)); // undefined:3
```

If not already indexed, you can index the current state by passing a _truthy_ argument to the id method.

```javascript
const state = new Understate({ initial: 0 });

state.set(increment)
  .then(() => {
    // Index current state and get its ID
    const id = state.id(true);

    return state.get(id);
  })
  .then(log) // 1
  .catch((error) => console.error('Error:', error));
```

Indexation is a good reason to consider immutability in your application. Using **mutators** (below) that return modified copies of your state without modifying the original ensures that each id points to a uniquely identifiable object.

### Asynchronous Mutators

You can modify an Understate instance at creation to take **asynchronous mutators** by passing a truthy "asynchronous" flag to the config function. Like normal (synchronous) **mutators** these functions take a state as an argument. Instead of returning a modified state; however, they return a promise resolved with the modified state.

Note: We can pass an "asynchronous" config option to "set" method to temporarily override the "asynchronous" flag

```javascript
/**
 * Logger utility
 * @param {*} value - Value to log
 */
const log = (value) => console.log(value);

// Builders
/**
 * Constant builder
 * @param {*} a - Constant value
 * @returns {Function} Mutator
 */
const constant = (a) => (_) => a;

/**
 * Async add message builder - simulates async operation
 * @param {string} message - Message to add
 * @returns {Function} Async mutator that adds message after delay
 */
const addMessageAsync = (message) => (messages) =>
  new Promise((resolve, reject) => {
    // Simulate random failures
    if (Math.random() < 0.25) {
      return reject(new Error('Simulated Async Failure'));
    }

    // Simulate async operation (e.g., API call)
    setTimeout(() => {
      resolve(messages.concat(message));
    }, 1000);
  });

// Mutators
const empty = constant([]);

// App with async support
const messages = new Understate({ asynchronous: true });
messages.subscribe(log);

// Initialize with synchronous mutator
messages.set(empty, { asynchronous: false })
  .then(() => messages.set(addMessageAsync('Hello')))
  .then(() => messages.set(addMessageAsync('there')))
  .then(() => messages.set(addMessageAsync('John.')))
  .then(() => console.log('All messages added successfully'))
  .catch((error) => {
    console.error('Failed to add message:', error);
  });

// Output (on success):
// []
// ['Hello']
// ['Hello', 'there']
// ['Hello', 'there', 'John.']
// All messages added successfully

// OR (on failure):
// []
// ['Hello']
// Failed to add message: Error: Simulated Async Failure
```

## Advanced Usage Patterns

### Pattern 1: Combining Multiple Mutators

You can compose mutators to create more complex state transformations:

```javascript
/**
 * Compose multiple mutators into a single mutator
 * @param {...Function} mutators - Mutators to compose
 * @returns {Function} Composed mutator
 */
const compose = (...mutators) => (state) =>
  mutators.reduce((currentState, mutator) => mutator(currentState), state);

/**
 * Double a number
 * @param {number} x - Number to double
 * @returns {number} Doubled value
 */
const double = (x) => x * 2;

/**
 * Add 10 to a number
 * @param {number} x - Number to increment
 * @returns {number} Incremented value
 */
const addTen = (x) => x + 10;

// Compose mutators
const doubleThenAddTen = compose(double, addTen);

const state = new Understate({ initial: 5 });

state.set(doubleThenAddTen)
  .then((result) => console.log(result)) // 20 (5 * 2 + 10)
  .catch((error) => console.error('Error:', error));
```

### Pattern 2: Conditional Mutations

Implement conditional logic within mutators:

```javascript
/**
 * Conditional builder - applies mutator only if condition is met
 * @param {Function} predicate - Condition function
 * @param {Function} mutator - Mutator to apply if condition is true
 * @returns {Function} Conditional mutator
 */
const when = (predicate, mutator) => (state) =>
  predicate(state) ? mutator(state) : state;

/**
 * Check if value is below maximum
 * @param {number} max - Maximum value
 * @returns {Function} Predicate function
 */
const isBelow = (max) => (value) => value < max;

// Only increment if below 10
const incrementIfBelow10 = when(isBelow(10), increment);

const counter = new Understate({ initial: 9 });
counter.subscribe(log);

counter.set(incrementIfBelow10)
  .catch((error) => console.error('Error:', error)); // 10

counter.set(incrementIfBelow10)
  .catch((error) => console.error('Error:', error)); // 10 (no change)
```

### Pattern 3: State Validation

Add validation to ensure state integrity:

```javascript
/**
 * Validate builder - wraps mutator with validation
 * @param {Function} validator - Validation function
 * @param {Function} mutator - Mutator to validate
 * @returns {Function} Validated mutator
 */
const validate = (validator, mutator) => (state) => {
  const newState = mutator(state);

  if (!validator(newState)) {
    throw new Error('Invalid state produced by mutator');
  }

  return newState;
};

/**
 * Check if value is positive
 * @param {number} value - Value to check
 * @returns {boolean} True if positive
 */
const isPositive = (value) => value >= 0;

// Create validated decrement that prevents negative numbers
/**
 * Decrement by 1
 * @param {number} x - Value to decrement
 * @returns {number} Decremented value
 */
const decrement = (x) => x - 1;

const validatedDecrement = validate(isPositive, decrement);

const positiveCounter = new Understate({ initial: 1 });

positiveCounter.set(validatedDecrement)
  .then(log) // 0
  .catch((error) => console.error('Error:', error));

positiveCounter.set(validatedDecrement)
  .catch((error) => console.error('Validation failed:', error)); // Error: Invalid state
```

### Pattern 4: Time-Travel Debugging

Leverage indexation for time-travel debugging:

```javascript
/**
 * @typedef {Object} StateHistory
 * @property {Understate} state - The state instance
 * @property {Array<string>} history - Array of state IDs
 */

/**
 * Create a state manager with history tracking
 * @param {*} initial - Initial state value
 * @returns {StateHistory} State with history
 */
const createHistoryState = (initial) => {
  const state = new Understate({ initial, index: true });
  const history = [];

  // Track all state IDs
  state.subscribe((_, id) => {
    if (id) history.push(id);
  });

  return { state, history };
};

/**
 * Go back to a previous state
 * @param {StateHistory} historyState - State with history
 * @param {number} steps - Number of steps to go back
 * @returns {Promise} Promise resolved with historical state
 */
const goBack = (historyState, steps) => {
  const { state, history } = historyState;
  const targetIndex = history.length - steps - 1;

  if (targetIndex < 0) {
    return Promise.reject(new Error('Cannot go back that far'));
  }

  const targetId = history[targetIndex];
  return state.get(targetId);
};

// Usage
const { state, history } = createHistoryState(0);

const runHistoryExample = async () => {
  try {
    await state.set(increment, { index: true });
    await state.set(increment, { index: true });
    await state.set(increment, { index: true });

    // Current state is 3
    const current = await state.get();
    console.log('Current:', current); // 3

    // Go back 2 steps
    const previous = await goBack({ state, history }, 2);
    console.log('2 steps back:', previous); // 1
  } catch (error) {
    console.error('Error:', error);
  }
};

runHistoryExample();
```

### Pattern 5: Async/Await with Error Handling

Modern async/await patterns for cleaner code:

```javascript
/**
 * Fetch data builder - simulates API call
 * @param {string} url - URL to fetch
 * @returns {Function} Async mutator
 */
const fetchData = (url) => async (state) => {
  try {
    // Simulate API call
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      ...state,
      data,
      loading: false,
      error: null
    };
  } catch (error) {
    return {
      ...state,
      data: null,
      loading: false,
      error: error.message
    };
  }
};

/**
 * Set loading state
 * @param {Object} state - Current state
 * @returns {Object} State with loading flag
 */
const setLoading = (state) => ({
  ...state,
  loading: true,
  error: null
});

// Usage with async/await
const dataState = new Understate({
  initial: { data: null, loading: false, error: null },
  asynchronous: true
});

const loadData = async () => {
  try {
    // Set loading state
    await dataState.set(setLoading);

    // Fetch data
    await dataState.set(fetchData('https://api.example.com/data'));

    const finalState = await dataState.get();
    console.log('Data loaded:', finalState);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};
```

### Pattern 6: Multiple Subscribers with Different Concerns

Separate concerns using multiple subscribers:

```javascript
/**
 * Create logger subscriber
 * @param {string} prefix - Prefix for log messages
 * @returns {Function} Subscriber function
 */
const createLogger = (prefix) => (state) => {
  console.log(`[${prefix}]`, state);
};

/**
 * Create persistence subscriber
 * @param {string} key - Storage key
 * @returns {Function} Subscriber function
 */
const createPersister = (key) => (state) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
};

/**
 * Create analytics subscriber
 * @param {Function} analyticsService - Analytics service
 * @returns {Function} Subscriber function
 */
const createAnalytics = (analyticsService) => (state, id) => {
  try {
    analyticsService.track('state_changed', {
      stateId: id,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to track analytics:', error);
  }
};

// Usage
const appState = new Understate({ initial: { count: 0 }, index: true });

// Multiple subscribers for different concerns
const loggerUnsub = appState.subscribe(createLogger('APP'));
const persisterUnsub = appState.subscribe(createPersister('app-state'));
const analyticsUnsub = appState.subscribe(
  createAnalytics({ track: (event, data) => console.log(event, data) })
);

// All subscribers are notified of changes
appState.set((state) => ({ count: state.count + 1 }))
  .catch((error) => console.error('Error:', error));
```

## Redux Comparison

### Actions & Reducers

**Setting state in Understate using a mutator:**

```javascript
Understate#.set(mutator);
```

**Setting state in Redux using an action:**

```javascript
Redux#store.dispatch(action);
```

### Routers vs Reducers

**Routers/builders** in Understate are essentially reducers from Redux that have been abstracted out of the core library.

Setting state using an "action" in Understate - the "action" schema is defined by how the router interprets it:

```javascript
Understate#.set(router(action));
```

**Router signature** (curried reducer):

```javascript
action => previousState => newState
```

**Redux reducer signature:**

```javascript
(previousState, action) => newState
```

If you were to reverse the parameters in a Redux reducer and [curry](https://en.wikipedia.org/wiki/Currying) it, you'd end up with an Understate **router**.

### Action Flexibility

Actions in Understate are more flexible than Redux - they don't need a specific format:

**Redux:** An action must be a JSON object with a mandatory "type" attribute

```javascript
{ type: 'INCREMENT', payload: 1 }
```

**Understate:** An action can be any format your router handles

```javascript
{ builder: 'add', parameter: 1 }
// or any other schema you design
```

## API Reference

This API is designed for ECMAScript 6 (2015) and above. It makes no assumptions about the running environment of your application.

### Installation & Import

```javascript
import Understate from 'understate';
```

---

## Constructor

### `new Understate(config)`

Creates a new Understate instance with optional configuration.

#### Parameters

- **config** `Object` (optional) - Configuration object with the following properties:
  - **initial** `any` (default: `undefined`) - The initial state value
  - **index** `boolean` (default: `false`) - Whether to automatically index state changes by ID
  - **asynchronous** `boolean` (default: `false`) - Whether to use asynchronous mutators by default

#### Returns

- `Understate` - A new Understate instance

#### Examples

Create an instance with default settings:
```javascript
const state = new Understate();
```

Create an instance with an initial value:
```javascript
const counter = new Understate({ initial: 0 });
const todos = new Understate({ initial: [] });
const user = new Understate({ initial: { name: 'John', age: 30 } });
```

Create an instance that automatically indexes state:
```javascript
const state = new Understate({
  initial: { count: 0 },
  index: true
});
```

Create an instance for asynchronous operations:
```javascript
const asyncState = new Understate({
  initial: [],
  asynchronous: true
});
```

---

## Instance Methods

All methods are called on an instance of Understate. For the following examples, assume `state` is an instance created with `const state = new Understate()`.

---

### `state.set(mutator, options)`

Updates the internal state by applying a mutator function to the current state.

#### Parameters

- **mutator** `Function` (required) - A pure function that takes the current state and returns the new state
  - Signature: `(currentState) => newState`
  - For asynchronous mode: `(currentState) => Promise<newState>`
- **options** `Object` (optional) - Configuration object:
  - **index** `boolean` (default: instance's index setting) - Whether to index this state change
  - **asynchronous** `boolean` (default: instance's asynchronous setting) - Whether to treat the mutator as asynchronous

#### Returns

- `Promise<newState>` - A promise that resolves with the new state value
- `Promise<[newState, id]>` - When `index: true`, resolves with state and its ID

#### Examples

Basic state update:
```javascript
const increment = x => x + 1;
const state = new Understate({ initial: 0 });

state.set(increment).then(newState => {
  console.log(newState); // 1
});
```

Update with indexing:
```javascript
const addItem = item => items => [...items, item];
const state = new Understate({ initial: [] });

state.set(addItem('Task 1'), { index: true }).then(([newState, id]) => {
  console.log(newState); // ['Task 1']
  console.log(id);       // unique identifier for this state
});
```

Asynchronous state update:
```javascript
const fetchData = url => state => {
  return fetch(url)
    .then(response => response.json())
    .then(data => ({ ...state, data }));
};

const state = new Understate({ initial: {}, asynchronous: true });

state.set(fetchData('/api/users')).then(newState => {
  console.log(newState); // { data: [...] }
});
```

Chained updates:
```javascript
const state = new Understate({ initial: 0 });
const add = n => x => x + n;

state.set(add(5))
  .then(() => state.set(add(3)))
  .then(() => state.set(add(2)))
  .then(() => state.get())
  .then(result => console.log(result)); // 10
```

---

### `state.s(mutator, options)`

Shorthand for `set()` that returns the Understate instance for method chaining.

#### Parameters

Same as `state.set()`.

#### Returns

- `Understate` - The same Understate instance (for chaining)

#### Examples

Chainable updates:
```javascript
const state = new Understate({ initial: 0 });
const add = n => x => x + n;

state
  .s(add(1))
  .s(add(2))
  .s(add(3))
  .subscribe(value => console.log(value));
// Note: Execution order is not guaranteed
```

---

### `state.get(id)`

Retrieves the current state or a previously indexed state by ID.

#### Parameters

- **id** `string` (optional) - The ID of a previously indexed state

#### Returns

- `Promise<currentState>` - When called without arguments, returns the current state
- `Promise<indexedState>` - When called with an ID, returns the state associated with that ID

#### Examples

Get current state:
```javascript
const state = new Understate({ initial: { count: 0 } });

state.get().then(currentState => {
  console.log(currentState); // { count: 0 }
});
```

Get indexed state:
```javascript
const state = new Understate({ initial: 0, index: true });
const increment = x => x + 1;

state.subscribe((value, id) => {
  // Store the ID for later retrieval
  setTimeout(() => {
    state.get(id).then(historicalState => {
      console.log('State at', id, ':', historicalState);
    });
  }, 5000);
});

state.set(increment); // 1
state.set(increment); // 2
state.set(increment); // 3
// After 5 seconds, logs historical states: 1, 2, 3
```

---

### `state.id(shouldIndex)`

Returns the ID of the current state, optionally indexing it.

#### Parameters

- **shouldIndex** `boolean` (optional, default: `false`) - If `true`, indexes the current state before returning its ID

#### Returns

- `string` - The unique identifier for the current state (not a Promise)

#### Examples

Get the current state ID:
```javascript
const state = new Understate({ initial: 'hello' });
const currentId = state.id();
console.log(currentId); // unique ID string
```

Get and index the current state:
```javascript
const state = new Understate({ initial: { value: 42 } });
const increment = obj => ({ value: obj.value + 1 });

state.set(increment).then(() => {
  const id = state.id(true); // Index the current state

  // Later, retrieve this state
  state.get(id).then(savedState => {
    console.log(savedState); // { value: 43 }
  });
});
```

---

### `state.subscribe(subscriber)`

Registers a callback function to be called whenever the state changes.

#### Parameters

- **subscriber** `Function` (required) - Callback function invoked on state changes
  - Signature: `(newState) => void`
  - With indexing: `(newState, id) => void`

#### Returns

- `Understate` - A linked Understate instance with an `unsubscribe()` method

#### Examples

Basic subscription:
```javascript
const state = new Understate({ initial: 0 });
const increment = x => x + 1;

state.subscribe(newState => {
  console.log('State changed to:', newState);
});

state.set(increment); // Logs: "State changed to: 1"
state.set(increment); // Logs: "State changed to: 2"
```

Subscription with indexing:
```javascript
const state = new Understate({ initial: [], index: true });
const addItem = item => items => [...items, item];

state.subscribe((newState, id) => {
  console.log('State ID:', id);
  console.log('New state:', newState);
});

state.set(addItem('Apple'));
// Logs: "State ID: <unique-id>"
// Logs: "New state: ['Apple']"
```

Multiple subscribers:
```javascript
const state = new Understate({ initial: 0 });

state.subscribe(value => console.log('Subscriber 1:', value));
state.subscribe(value => console.log('Subscriber 2:', value));

state.set(x => x + 1);
// Logs: "Subscriber 1: 1" (order not guaranteed)
// Logs: "Subscriber 2: 1"
```

---

### `subscription.unsubscribe()`

Cancels a subscription created with `subscribe()`. Call this method on the object returned by `subscribe()`.

#### Parameters

None

#### Returns

- `void`

#### Examples

Unsubscribe from updates:
```javascript
const state = new Understate({ initial: 0 });
const increment = x => x + 1;

const subscription = state.subscribe(value => {
  console.log('Value:', value);
});

state.set(increment); // Logs: "Value: 1"

subscription.unsubscribe();

state.set(increment); // Nothing logged
```

Conditional unsubscription:
```javascript
const state = new Understate({ initial: 0 });
const increment = x => x + 1;

const subscription = state.subscribe(value => {
  console.log('Count:', value);

  if (value >= 5) {
    subscription.unsubscribe();
    console.log('Unsubscribed at 5');
  }
});

state.set(increment); // Logs: "Count: 1"
state.set(increment); // Logs: "Count: 2"
state.set(increment); // Logs: "Count: 3"
state.set(increment); // Logs: "Count: 4"
state.set(increment); // Logs: "Count: 5" and "Unsubscribed at 5"
state.set(increment); // Nothing logged
```

---

## Important Implementation Notes

### Subscription Behavior

The subscription system uses JavaScript `Set` for tracking subscribers, which has specific implications:

#### Function Uniqueness

Each unique function reference creates a separate subscription:

```javascript
const state = new Understate({ initial: 0 });

// Creates THREE separate subscriptions
const logFactory = () => value => console.log(value);
state.subscribe(logFactory());
state.subscribe(logFactory());
state.subscribe(logFactory());

state.set(x => x + 1); // Logs "1" three times
```

Reusing the same function reference creates only ONE subscription:

```javascript
const state = new Understate({ initial: 0 });

// Creates ONE subscription (subsequent calls have no effect)
const logger = value => console.log(value);
state.subscribe(logger);
state.subscribe(logger);
state.subscribe(logger);

state.set(x => x + 1); // Logs "1" once
```

#### Execution Order

Subscriber execution order is not guaranteed:

```javascript
const state = new Understate({ initial: 0 });

state.subscribe(x => console.log('First?', x));
state.subscribe(x => console.log('Second?', x));
state.subscribe(x => console.log('Third?', x));

state.set(x => x + 1);
// Output order may vary between executions
```

### Mutator Best Practices

Mutators should be pure functions that:
- Do not modify the input state (respect immutability)
- Have no side effects
- Return a new state value

```javascript
// Good: Returns new object
const goodMutator = state => ({ ...state, count: state.count + 1 });

// Bad: Modifies input state
const badMutator = state => {
  state.count += 1;
  return state;
};
```

---

## License

See the [LICENSE](https://github.com/johnhenry/understate/blob/master/LICENSE) file for details.
