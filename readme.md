# Understate

A simple, flexible state manager inspired by Redux with functional programming concepts.

[![NPM version](https://img.shields.io/npm/v/understate.svg)](https://www.npmjs.com/package/understate)

## Table of Contents

- [About](#about)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Basic Usage](#basic-usage)
  - [Indexation](#indexation)
  - [Mutators](#mutators)
  - [Builders](#builders)
  - [Routers](#routers)
  - [Asynchronous Mutators](#asynchronous-mutators)
- [API Reference](#api-reference)
  - [Constructor](#constructor)
  - [Instance Methods](#instance-methods)
- [Redux Comparison](#redux-comparison)
- [Contributing](#contributing)
- [License](#license)

## About

Understate was inspired by [Redux](https://github.com/rackt/redux/) and aims to provide similar functionality with some parts abstracted using higher-order functional concepts.

**Key Features:**
- Simple, predictable state management
- Functional programming approach with mutators and builders
- Built-in state indexation for time-travel debugging
- Support for both synchronous and asynchronous state updates
- Lightweight with no dependencies

Understate provides a mechanism for indexing and retrieving states by *id*, enabling powerful features like undo/redo and time-travel debugging.

**Note on Immutability:** Understate does not enforce immutability. However, using immutable objects as state values has significant advantages related to performance, correctness, and maintainability. Consider using it with a library such as [Immutable.js](https://github.com/facebook/immutable-js/).

## Installation

Using npm:

```bash
npm install understate
```

Using yarn:

```bash
yarn add understate
```

## Quick Start

Here's a minimal example to get you started:

```javascript
import Understate from 'understate';

// Create a state manager with initial value
const counter = new Understate({ initial: 0 });

// Subscribe to state changes
counter.subscribe(value => console.log('Counter:', value));

// Define a mutator function
const increment = state => state + 1;

// Update state
counter.set(increment); // Counter: 1
counter.set(increment); // Counter: 2
```

## Core Concepts

### Basic Usage

When you create an Understate object, it has an initial internal state that can be accessed via the `get` method.

```javascript
import Understate from 'understate';
const log = value => console.log(value);
const state = new Understate();
state.get().then(log); // undefined
```

You can pass an initial value when creating an Understate object:

```javascript
const state = new Understate({ initial: 0 });
state.get().then(log); // 0
```

Update the internal value by passing a **mutator** function to the `set` method:

```javascript
const increment = x => x + 1;
const state = new Understate({ initial: 0 });
state.get().then(log); // 0
state.set(increment).then(log); // 1
```

Subscribe to updates with the `subscribe` method:

```javascript
const state = new Understate({ initial: 0 });
state.subscribe(log);
state.set(increment); // 1
state.set(increment); // 2
state.set(increment); // 3
```

Unsubscribe by calling the `unsubscribe` method on the object returned by `subscribe`:

```javascript
const state = new Understate({ initial: 0 });
const unsubscriber = state.subscribe(log);
state.set(increment); // 1
state.set(increment); // 2
unsubscriber.unsubscribe();
state.set(increment); // (Nothing logged)
```

### Indexation

Understate objects track their state internally with unique identifiers.

Each Understate object associates an id with its value whenever the value is updated. Access this id via the `id` method:

```javascript
const state = new Understate({ initial: 0 });
log(state.id()); // <ID>
state.set(increment).then(x => console.log(state.id())); // <ID (Different)>
```

Passing a truthy `index` config option to the `set` function causes its id to be passed as a second argument to subscription callbacks:

```javascript
const logId = (value, id) => console.log(`${id}:${value}`);
const state = new Understate({ initial: 0 });
state.subscribe(logId);
state.set(increment, { index: true }); // <ID>:1
state.set(increment, { index: true }); // <ID>:2
state.set(increment, { index: true }); // <ID>:3
```

The `index` option also causes the Understate object to internally store the state by id. Later, retrieve any indexed state by passing its id to the `get` method:

```javascript
const state = new Understate({ initial: 0 });
state.subscribe((value, id) => setTimeout(_ => state.get(id).then(log), 5000));
state.set(increment, { index: true }); // 1 (After 5 seconds)
state.set(increment, { index: true }); // 2 (After 5 seconds)
state.set(increment, { index: true }); // 3 (After 5 seconds)
```

Passing a truthy `index` option to the constructor causes the `set` function to automatically index values:

```javascript
const logId = (value, id) => console.log(`${id}:${value}`);
const state = new Understate({ initial: 0, index: true });
state.subscribe(logId);
state.set(increment); // <ID>:1
state.set(increment); // <ID>:2
state.set(increment, { index: false }); // undefined:3
```

Index the current state manually by passing a truthy argument to the `id` method:

```javascript
const state = new Understate({ initial: 0 });
state.set(increment);
const id = state.id(true);
state.get(id).then(log); // 1
```

**Indexation and Immutability:** Using **mutators** that return modified copies of your state (without modifying the original) ensures that each id points to a uniquely identifiable object. This is crucial for features like time-travel debugging.

## Mutators

**Mutator** functions should be pure functions (no side effects) that take in a state and return an updated copy without modifying the original (respecting immutability). While these properties are not programmatically enforced, following this convention is strongly recommended.

### Signature

A **mutator** should have the following function signature:

```javascript
state => {/* some combination of closure and "state" */};
```

### Example

This mutator returns the state incremented by 1:

```javascript
const increment = state => state + 1;
```

### Redux Comparison

Setting state using a mutator function in Understate:

```javascript
Understate#.set(mutator);
```

Setting state using an action object in Redux:

```javascript
Redux#store.dispatch(action);
```

## Builders

Since a **mutator** function only takes in a state, any modifications must be based on its closure.

We can leverage this by creating mutation **builder** functions that take parameters as arguments and return **mutators** using those parameters in their closure.

### Signature

A **builder** function should have the following function signature:

```javascript
(...parameters) => state => {/* some combination of closure, "parameters", and "state" */};
// OR
(...parameters) => /* <Mutator> */;
```

### Example

```javascript
const adder = y => x => x + y;
const increment = adder(1);
// This is equivalent to: increment = x => x + 1
```

### Redux Comparison

A **builder** function and a Redux reducer function are very similar.

**Builder Function:**

```javascript
(...parameters) => previousState => newState
```

**Reducer Function:**

```javascript
(previousState, action) => newState
```

If you reverse the parameters in a reducer and [curry](https://en.wikipedia.org/wiki/Currying) it:

```javascript
action => previousState => newState
```

You end up with a **builder** that takes an "action" as its only parameter.

### Initialization with Constant Function Builders

It's often useful to set a state rather than modify it. Use a function that returns a constant:

```javascript
const one = _ => 1;
const state = new Understate();
state.subscribe(log);
state.set(one); // 1
state.set(one); // 1
state.set(one); // 1
```

Create constant function **builders** as well:

```javascript
const constant = a => _ => a;
const one = constant(1); // Equivalent to "one" defined above
const state = new Understate();
state.subscribe(log);
state.set(one); // 1
state.set(one); // 1
state.set(constant(1)); // 1
```

### Using Builders

Using different types of **builders** allows elegant expression of state modifications:

```javascript
// CounterApplication.js
import Understate from 'understate';
const log = value => console.log(value);

// Builders
const constant = a => _ => a;
const adder = a => b => b + a;

// Mutators
const zero = constant(0);
const increment = adder(1);

// App
const counter = new Understate();
counter.subscribe(log);
counter.set(zero); // 0
counter.set(increment); // 1
counter.set(adder(2)); // 3
```

```javascript
// MessageApplication.js
import Understate from 'understate';
const log = value => console.log(value);

// Builders
const constant = a => _ => a;
const addMessage = message => messages => messages.concat(message);

// Mutators
const empty = constant([]);

// App
const messages = new Understate();
messages.subscribe(log);
messages.set(empty); // []
messages.set(addMessage('Hello')); // ['Hello']
messages.set(addMessage('there')); // ['Hello', 'there']
messages.set(addMessage('John.')); // ['Hello', 'there', 'John.']
```

#### Decorators

Redux has a concept of *middleware* to intercept objects and perform actions such as logging.

In Understate, design your **mutators** to perform these actions directly:

```javascript
// MessageApplication.js
import Understate from 'understate';
const receiveLog = value => { console.log(value + ' received.'); return value; };

// Builders
const constant = a => _ => { console.log('Setting constant: ' + a); return a; };
const addMessageLog = message => messages => messages.concat(receiveLog(message));

// Mutators
const empty = constant([]);

// App
const messages = new Understate();
messages.set(empty); // 'Setting constant: '
messages.set(addMessageLog('Hello')); // 'Hello received.'
messages.set(addMessageLog('there')); // 'there received.'
messages.set(addMessageLog('John.')); // 'John. received.'
```

**Decorators** take functions and return similar functions with enhanced functionality. They should take a function as one of their arguments and return a function with the same signature. Apply them to **builder** functions:

```javascript
// MessageApplication.js
import Understate from 'understate';

// Decorators
const logInput = (target = _ => _, preamble = '', conclusion = '') => (...args) => {
  console.log(preamble + String(args) + conclusion);
  return target.apply(this, args);
};

// Builders
const constant = logInput(a => _ => a, 'Setting constant: ');
const addMessage = logInput(
  message => messages => messages.concat(message),
  '',
  ' received.'
);

// Mutators
const empty = constant([]);

// App
const messages = new Understate();
messages.set(empty); // 'Setting constant: '
messages.set(addMessage('Hello')); // 'Hello received.'
messages.set(addMessage('there')); // 'there received.'
messages.set(addMessage('John.')); // 'John. received.'
```

**Note:** ECMAScript 2017 introduced a similar language feature also called "decorators" that works similarly but can only be applied to class methods.

## Routers

The final piece is the **router**. Its job is to take an "action" from another component and return a **mutator** function to apply to the current state. It does this by selecting a **builder** based on an "action" and extracting parameters from that "action".

Strictly speaking, **routers** are **builders**, as they take in a parameter ("action") and return a **mutator** function. However, they are a useful abstraction for deciding how to handle updates.

### Signature

A **router** should have the following signature:

```javascript
action => state => {/* some combination of closure, "action" parameters, and "state" */};
// OR
action => /* <Mutator> */;
```

### Example

Here's an application using a sample router:

```javascript
// File: sampleRouters.js

// Schema (not strictly necessary, but helpful)
// {
//   builder: <String>,
//   parameter: <Number>
// }

// Builders
const add = a => b => b + a;
const subtract = a => b => b - a;
const reset = a => _ => a;

const extractSubject = action => action.builder;
const extractParameters = action => action.parameter;

// Router Implementation: Dictionary
const builders = new Map();
builders.set('add', add);
builders.set('subtract', subtract);
builders.set('reset', reset);

const mapRouter = action => {
  const builder = builders.get(extractSubject(action));
  return builder ? builder(extractParameters(action)) : _ => _;
};

// Router Implementation: Switch Statement
const switchRouter = action => {
  let builder;
  switch (extractSubject(action)) {
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
      return _ => _;
  }
  return builder(extractParameters(action));
};

export default {
  mapRouter,
  switchRouter
};
```

```javascript
// File: application.js
import Understate from 'understate';
import { mapRouter as router } from './sampleRouters.js';

const state = new Understate({ initial: 0 });
state.subscribe(state => console.log(state));
const update = action => state.set(router(action));

export default update;
```

```javascript
// runner.js
import update from './application.js';

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

let action;
while ((action = actions.shift())) update(action);
// 1
// -1
// 0
```

## Asynchronous Mutators

You can modify an Understate instance at creation to accept **asynchronous mutators** by passing a truthy `asynchronous` flag to the config object. Like normal (synchronous) **mutators**, these functions take a state as an argument. Instead of returning a modified state directly, they return a promise that resolves with the modified state.

**Note:** Pass an `asynchronous` config option to the `set` method to temporarily override the `asynchronous` flag.

```javascript
const log = value => console.log(value);

// Builders
const constant = a => _ => a;
const addMessageAsync = message => messages => new Promise((resolve, reject) => {
  if (Math.random() < 0.25) return reject(new Error('Simulated Async Failure'));
  return setTimeout(() => resolve(messages.concat(message)), 1000);
});

// Mutators
const empty = constant([]);

// App
const messages = new Understate({ asynchronous: true });
messages.subscribe(log);
messages.set(empty, { asynchronous: false });
messages.set(addMessageAsync('Hello'))
  .then(_ => messages.set(addMessageAsync('there')))
  .then(_ => messages.set(addMessageAsync('John.')))
  .catch(log);
// []
// ['Hello']
// ['Hello', 'there']
// ['Hello', 'there', 'John.']
// OR
// [Error: Simulated Async Failure]
```

### Redux Comparison

#### Actions

Actions are similar but less flexible in Redux.

Setting state using an "action" in Understate (the "action" can be any format defined by how the router interprets it):

```javascript
Understate#.set(router(action));
```

Setting state in Redux using an action (an action must be a JSON object with a mandatory "type" attribute):

```javascript
Redux#store.dispatch(action);
```

#### Reducers

**Routers/builders** are essentially reducers from Redux abstracted out of the core library.

Recall the function signature of a **router**:

```javascript
action => state => {/* some combination of closure, "action" parameters, and "state" */};
```

This is essentially the same signature as a Redux reducer with parameters reversed and curried:

```javascript
action => previousState => newState
```

## API Reference

This API is written for ECMAScript 6 (2015). It makes no assumptions about the running environment.

### Import

```javascript
import Understate from 'understate';
```

### Constructor

#### `new Understate({initial?: any, index?: boolean, asynchronous?: boolean})`

Create a new Understate instance:

```javascript
const state = new Understate();
```

Create with an initial value:

```javascript
const state = new Understate({ initial: /* some initial value */ });
```

Create an instance that indexes state by default:

```javascript
const state = new Understate({ index: true });
```

Create an instance that expects asynchronous mutators:

```javascript
const state = new Understate({ asynchronous: true });
```

### Instance Methods

For this section, assume `state` is an available instance of Understate.

#### `Understate#set(mutator: Function, config?: {index?: boolean, asynchronous?: boolean}): Promise`

Update the internal state with a **mutator** function.

```javascript
const quoter = state => '"' + String(state) + '"';
state.set(quoter).then(state => console.log(state));
```

Update the state, index it, and pass its id along with state in the promise resolution:

```javascript
const quoter = state => '"' + String(state) + '"';
state.set(quoter, { index: true }).then((state, id) => console.log(id, state));
```

Update with an asynchronous mutator:

```javascript
const promiseMutator = state => new Promise(resolve => resolve(state));
state.set(promiseMutator, { asynchronous: true }).then(state => console.log(state));
```

#### `Understate#s(mutator: Function, config?: {index?: boolean, asynchronous?: boolean}): Understate`

Same as `Understate#set`, but returns the original object for chaining.

```javascript
state
  .s(/* first mutator */)
  .s(/* second mutator */)
  .s(/* third mutator */);
```

**Note:** There is no guarantee about the order in which chained methods are executed.

#### `Understate#id(): string`

Get the id of the current state.

```javascript
state.id();
```

**Note:** This method returns the id directly, not a promise.

#### `Understate#id(index: boolean): string`

Get the id of the current state and index it if not already indexed.

```javascript
state.id(true);
```

**Note:** This method returns the id directly, not a promise.

#### `Understate#get(): Promise`

Retrieve the current state.

```javascript
state.get().then(state => console.log(state));
```

#### `Understate#get(id: string): Promise`

Retrieve an indexed state by id.

```javascript
state.get(/* some id */).then(state => console.log(state));
```

#### `Understate#subscribe(subscriber: Function): Understate`

Subscribe to changes in state.

```javascript
state.subscribe(state => console.log(state));
```

#### `Understate#subscribe(subscriber: Function).unsubscribe(): void`

The object returned by `subscribe` is linked to the original via the prototype chain. Methods called on the original affect the new object and vice versa. The returned object has an `unsubscribe` method that cancels further updates.

```javascript
state.subscribe(state => console.log(state)).unsubscribe();
```

##### Subscribe Implementation Notes

The current implementation tracks subscriptions using a [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set), resulting in a few important behaviors:

###### Uniqueness

The following results in multiple subscriptions:

```javascript
const logEmitter = _ => state => console.log(state);
state.subscribe(logEmitter());
state.subscribe(logEmitter());
state.subscribe(logEmitter());
```

While the following results in only one subscription:

```javascript
const log = state => console.log(state);
state.subscribe(log);
state.subscribe(log);
state.subscribe(log);
```

Each `log` reference is the same object.

###### Order

There is no guarantee about the order in which subscriptions are called.

```javascript
state.subscribe(state => console.log('Or does this?'));
state.subscribe(state => console.log('Does this happen first?'));
state.set(/* some mutator */);
// (Might log: 'Does this happen first?' 'Or does this?')
```

## Redux Comparison

Understate was inspired by Redux and shares many conceptual similarities. Here are the key differences:

| Concept | Redux | Understate |
|---------|-------|------------|
| State update | `store.dispatch(action)` | `state.set(mutator)` or `state.set(router(action))` |
| State access | `store.getState()` | `state.get()` (returns Promise) |
| Subscribe | `store.subscribe(listener)` | `state.subscribe(listener)` |
| Logic | Reducers (built-in) | Builders/Routers (abstracted) |
| Actions | Required format | Flexible format |
| Immutability | Enforced by convention | Enforced by convention |
| Middleware | Built-in system | Use decorators on builders |

Understate abstracts the reducer concept into **builders** and **routers**, giving you more flexibility in how you structure your state management logic.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development

This project uses Docker for development tasks. Available scripts:

```bash
npm run build-images  # Build Docker images for development
npm run lint          # Run linter
npm run compile       # Compile the source code
npm run test          # Run tests
npm run demo          # Run demo
```

For Windows users, use the `-win` variants of the scripts (e.g., `npm run lint-win`).

## License

ISC License

Copyright (c) John Henry

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

**Repository:** https://github.com/johnhenry/understate
