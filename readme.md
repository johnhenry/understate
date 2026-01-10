# Understate
A simple state manager.

This was inspired by [Redux](https://github.com/rackt/redux/) along with another [old project of mine](https://github.com/johnhenry/polyfill-function).

Understate aims to be similar to Redux, but with some parts abstracted out of the core library using higher-order functional concepts.

In addition, Understate provides a mechanism for indexing and retrieve states by *id*.

Understate does not enforce immutability. However, using immutable objects as values for state has number advantages related to performance, correctness, and reasonability. Consider using it in conjunction with a library such as [Immutable](https://github.com/facebook/immutable-js/).

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

## Application Programming Interface

This API is written for ECMAScript 6 (2015). It makes no assumptions about the running environment of the application.

### Import

```javascript
import Understate from 'understate';
```

### Constructor -- new Understate({initial:any=undefined, index:boolean=false, asynchronous:boolean=false});

Create a new Understate instance

```javascript
const state = new Understate();
```

Create a new Understate instance with an initial value

```javascript
const state = new Understate({ initial: /* some initial value */ });
```

Create a new Understate instance that indexes state by default

```javascript
const state = new Understate({ index: true });
```

Create a new Understate instance that expects asynchronous mutators.

```javascript
const state = new Understate({ asynchronous: true });
```

### Instance Methods

These are methods attached to an instance.
For this section, you may assume "state" is an available instance of Understate.

#### Understate#set(mutator:function, {index:boolean=instance#index, asynchronous:boolean=instance#index});

Update the internal state of an Understate instance with a **mutator** (see above) function.

```javascript
/**
 * Quoter mutator - wraps state in quotes
 * @param {*} state - Current state
 * @returns {string} Quoted string
 */
const quoter = (state) => '"' + String(state) + '"';

state.set(quoter)
  .then((newState) => console.log(newState))
  .catch((error) => console.error('Error:', error));
```

Update the internal state of an Understate instance with a mutator function, index it, and pass its id along with state in the promise resolution.

```javascript
const quoter = (state) => '"' + String(state) + '"';

state.set(quoter, { index: true })
  .then((newState, id) => console.log(id, newState))
  .catch((error) => console.error('Error:', error));
```

Update the internal state of an Understate instance with an asynchronous mutator function, index it, and pass its id along with state in the promise resolution.

```javascript
/**
 * Async mutator example
 * @param {*} state - Current state
 * @returns {Promise<*>} Promise resolved with new state
 */
const promiseMutator = (state) =>
  new Promise((resolve) => resolve(state));

state.set(promiseMutator, { asynchronous: true })
  .then((newState) => console.log(newState))
  .catch((error) => console.error('Error:', error));
```

#### Understate#s(mutator:function, {index:boolean=instance#index, asynchronous:boolean=instance#index});

Same as Understate#set (See above), but returns the original object for chaining.

```javascript
state
  .s(/* first mutator */)
  .s(/* second mutator */)
  .s(/* third mutator */);
```

Note: There is no guarantee about the order in which these chained methods are executed.

#### Understate#id();

Get the id of the current state.

```javascript
const currentId = state.id();
console.log(currentId);
```

Note: this method returns the id directly and not a promise.

#### Understate#id(index:boolean);

Get the id of the current state and also index it if not already indexed.

```javascript
const currentId = state.id(true);
console.log(currentId);
```

Note: this method returns the id directly and not a promise.

#### Understate#get();

Retrieve the current state.

```javascript
state.get()
  .then((currentState) => console.log(currentState))
  .catch((error) => console.error('Error:', error));
```

#### Understate#get(id:string);

Retrieve an indexed state by id.

```javascript
state.get(/* some id */)
  .then((historicalState) => console.log(historicalState))
  .catch((error) => console.error('Error:', error));
```

#### Understate#subscribe(subscriber:function);

Subscribe to changes in a state

```javascript
/**
 * Subscriber function
 * @param {*} state - New state value
 * @param {string} [id] - State ID (if indexing enabled)
 */
const subscriber = (state, id) => {
  console.log('State changed:', state);
  if (id) console.log('State ID:', id);
};

state.subscribe(subscriber);
```

##### Understate#subscribe(subscriber:function).unsubscribe();

The object returned by "subscribe" is linked to the original via prototype-chain. Methods called on the original will affect the new object and vice-versa. In addition, the returned object has an "unsubscribe" method that cancels further updates from the original function passed to "subscribe".

```javascript
const unsubscriber = state.subscribe((state) => console.log(state));

// Later, to unsubscribe:
unsubscriber.unsubscribe();
```

##### Subscribe Implementation Notes

The current implementation tracks subscriptions using a [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set), resulting in a few "gotchas":

###### Uniqueness

The following would result in multiple subscriptions:

```javascript
/**
 * Factory that creates new logger functions
 * @returns {Function} New logger function
 */
const logEmitter = () => (state) => console.log(state);

state.subscribe(logEmitter());
state.subscribe(logEmitter());
state.subscribe(logEmitter());
```

while the following will only result in one

```javascript
const log = (state) => console.log(state);

state.subscribe(log);
state.subscribe(log);
state.subscribe(log);
```

as each 'log' is the same object.

###### Order

There is no guarantee as to the order in which subscriptions are called.

```javascript
state.subscribe((state) => console.log('Or does this?'));
state.subscribe((state) => console.log('Does this happen first?'));

state.set(/* some mutator */)
  .catch((error) => console.error('Error:', error));

// Might Log: 'Does this happen first?' 'Or does this?'
// Or might log in opposite order
```
