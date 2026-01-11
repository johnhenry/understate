<div align="center">

# Understate

**A simple, elegant state manager**

[![npm version](https://img.shields.io/npm/v/understate.svg?style=flat-square)](https://www.npmjs.com/package/understate)
[![license](https://img.shields.io/npm/l/understate.svg?style=flat-square)](https://github.com/johnhenry/understate/blob/master/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/understate.svg?style=flat-square)](https://www.npmjs.com/package/understate)
[![bundle size](https://img.shields.io/bundlephobia/minzip/understate.svg?style=flat-square)](https://bundlephobia.com/package/understate)

</div>

---

This was inspired by [Redux](https://github.com/rackt/redux/) along with another [old project of mine](https://github.com/johnhenry/polyfill-function).

Understate aims to be similar to Redux, but with some parts abstracted out of the core library using higher-order functional concepts.

In addition, Understate provides a mechanism for indexing and retrieve states by *id*.

Understate does not enforce immutability. However, using immutable objects as values for state has number advantages related to performance, correctness, and reasonability. Consider using it in conjunction with a library such as [Immutable](https://github.com/facebook/immutable-js/).

## Quick Start

### Installation

Install Understate via npm:

```bash
npm install understate
```

Or with yarn:

```bash
yarn add understate
```

### Minimal Working Example

Here's the simplest way to get started with Understate:

```javascript
import Understate from 'understate';

// Create a new state instance with an initial value
const state = new Understate({ initial: 0 });

// Subscribe to state changes
state.subscribe(value => console.log('State updated:', value));

// Define a mutator function to update state
const increment = x => x + 1;

// Update the state
state.set(increment); // Logs: "State updated: 1"
state.set(increment); // Logs: "State updated: 2"
```

### Common Use Cases

#### Counter Application

A simple counter with increment, decrement, and reset functionality:

```javascript
import Understate from 'understate';

// Define mutator builders
const add = amount => value => value + amount;
const reset = () => _ => 0;

// Create state
const counter = new Understate({ initial: 0 });
counter.subscribe(value => console.log('Counter:', value));

// Use the counter
counter.set(add(1));      // Counter: 1
counter.set(add(5));      // Counter: 6
counter.set(add(-2));     // Counter: 4
counter.set(reset());     // Counter: 0
```

#### Managing Application State

Track complex state like a todo list:

```javascript
import Understate from 'understate';

// Define mutator builders
const addTodo = todo => todos => [...todos, todo];
const removeTodo = index => todos => todos.filter((_, i) => i !== index);
const toggleTodo = index => todos => todos.map((todo, i) =>
  i === index ? { ...todo, done: !todo.done } : todo
);

// Initialize state
const todos = new Understate({ initial: [] });
todos.subscribe(state => console.log('Todos:', state));

// Add todos
todos.set(addTodo({ text: 'Learn Understate', done: false }));
todos.set(addTodo({ text: 'Build an app', done: false }));

// Toggle completion
todos.set(toggleTodo(0));
```

#### Async Operations

Handle asynchronous state updates:

```javascript
import Understate from 'understate';

// Async mutator builder
const fetchUser = userId => currentState =>
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(user => ({ ...currentState, user }));

// Create async state
const appState = new Understate({
  initial: { user: null },
  asynchronous: true
});

appState.subscribe(state => console.log('User:', state.user));

// Fetch user data
appState.set(fetchUser(123))
  .then(() => console.log('User loaded!'))
  .catch(err => console.error('Failed to load user:', err));
```

#### State History with Indexing

Track state history for undo/redo functionality:

```javascript
import Understate from 'understate';

const state = new Understate({
  initial: 'Start',
  index: true  // Enable automatic indexing
});

const ids = [];

// Track state IDs
state.subscribe((value, id) => {
  console.log('State:', value);
  if (id) ids.push(id);
});

// Make some changes
state.set(() => 'First change');
state.set(() => 'Second change');
state.set(() => 'Third change');

// Retrieve previous state
state.get(ids[0]).then(value => console.log('First state:', value));
```

### Quick Tips

1. **Mutators should be pure functions**: They take state as input and return a new state without side effects.

2. **Use builder patterns**: Create reusable mutator factories for common operations:
   ```javascript
   const updateField = field => value => state => ({ ...state, [field]: value });
   ```

3. **Chain updates**: Use the `.s()` method for chaining (though order isn't guaranteed):
   ```javascript
   state.s(increment).s(increment).s(increment);
   ```

4. **Get current state**: Use the `.get()` method when you need to read state:
   ```javascript
   state.get().then(value => console.log(value));
   ```

5. **Unsubscribe when done**: Always clean up subscriptions:
   ```javascript
   const subscription = state.subscribe(console.log);
   // Later...
   subscription.unsubscribe();
   ```

### Next Steps

- Read the [Basic Usage](#basic-usage) section for detailed examples
- Learn about [Mutators](#mutators) and [Builders](#builders) for advanced patterns
- Explore [Routers](#routers) for handling complex action flows
- Check out [Async Mutators](#asynchronous-mutators) for async operations

## About
Understate works by creating objects that ingest *mutator* functions to update their *internal state*.
Wait, what?!

...Okay, let's start over... maybe if we just jump right into it...

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

## Mutators

**Mutator** functions should be pure functions (they have no side effects) that take in a state and return an updated copy of that state without modifying the original (they respect immutability). With that said, these ideas are pretty much programmatically unenforceable, so if you wish to follow this convention, you'll have to take special care to enforce these properties upon your code yourself.

### Signature

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

### Example

This mutator returns the state incremented by 1

```javascript
/**
 * Increment mutator - pure function that increments a number
 * @param {number} state - Current numeric state
 * @returns {number} State incremented by 1
 */
const increment = (state) => state + 1;
```

### Redux Comparison

Setting state using a mutator function in Understate

```javascript
Understate#.set(mutator);
```

Setting state using an action object in Redux

```javascript
Redux#store.dispatch(action);
```

## Builders
Since a **mutator** function only takes in a state, any modifications that are made to it must be based on its closure.

We can take advantage of this by creating mutation **builder** functions that takes, as arguments, a set of parameters and return **mutators** that use the parameters in its closure.

### Signature
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

### Example

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

### Redux Comparison

We can see that a **builder** function and a reducer function from Redux are very similar.

#### Builder Function

```javascript
(...parameters) => previousState => newState
```

#### Reducer Function

```javascript
(previousState, action) => newState
```

If you were to reverse the parameters in a reducer...

```javascript
(action, previousState) => newState
```

and then [Schönfinkel](https://en.wikipedia.org/wiki/Currying) it

```javascript
action => previousState => newState
```

you'd end up with a **builder** that takes an "action" as its only parameter

### Initialization with Constant Function Builders

It's often useful to set a state rather than modify it. In this case, we
can use a function that returns a constant.

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

### Using Builders

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

## Routers

The final piece of the puzzle is the **router**. Its job is to take "action" from another component in the application, and return a **mutator** function to be applied to the current state. It does this by selecting a **builder** based on an "action" and extracting parameters from that "action".

Strictly speaking, **routers** are **builders**, as they take in a parameter, "action", and return a **mutator** function. They are still; however, a useful abstraction when it comes to deciding how to handle updates.

### Signature

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


### Example

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

## Asynchronous Mutators

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

### Redux Comparison

#### Actions

Actions are similar, but are less flexible in Redux

Setting state using an "action" -- Here, the "action" mustn't be of any specific format -- its schema is defined by how the router interprets it

```javascript
Understate#.set(router(action));
```

Setting state in Redux using an action -- Here, an action is a loosely formatted JSON object with a mandatory "type" attribute

```javascript
Redux#store.dispatch(action);
```

#### Reducers

**Routers/builders** are essentially reducers from Redux that have been abstracted out of the core library.

Recall the function signature a **router**:

```javascript
action => state => {
  /* some combination of closure, "action" parameters, and "state" */
  return newState;
};
```

This is essentially the same signature as a Redux reducer, which first had its parameters reversed, and then had Schönfinkeling applied.

```javascript
action => previousState => newState
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

## Testing Section
## Installation Notes

Run `npm install` to install dependencies.
