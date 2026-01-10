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

When you first create an Understate object, it has an initial internal state that can be accesses via the "get" method.

```javascript
import Understate from 'Understate';
var log   = value => console.log(value);
var state = new Understate();
state.get().then(log);//undefined
```

You can also pass an initial value when creating a Understate object.

```javascript
var state = new Understate({initial: 0});
state.get().then(log);//0
```

You can update the internal value by passing a **mutator** (See Below) function to the "set" method.

```javascript
var increment = x => x + 1;
var state     = new Understate({initial: 0});
state.get().then(log);//0
state.set(increment).then(log);//1
```

You can subscribe to updates with the **"subscribe"** method.

```javascript
var state     = new Understate({initial: 0});
state.subscribe(log);
state.set(increment);//1
state.set(increment);//2
state.set(increment);//3
```

You can unsubscribe to updates by calling the **"unsubscribe"** method on the object returned by the subscribe method.

```javascript
var state         = new Understate({initial: 0});
var unsubscriber  = state.subscribe(log);
state.set(increment);//1
state.set(increment);//2
unsubscriber.unsubscribe();
state.set(increment);//(Nothing logged)
```

### Indexation

Understate objects track their state internally.

Each Understate object associates an id with it's value whenever it's value us update. This can be accessed from the **"id"** method.

```javascript
var state     = new Understate({initial:0});
log(state.id());//*<ID>
state.set(increment).then(x=>console.log(state.id()));//*<ID(Different)>
```

Passing a _truthy_ "index" config option to the **"set"** function will cause its id to be passed as a second argument to the function passed to subscribe.

```javascript
var logId     = (value, id) => console.log(`${id}:${value}`);
var state     = new Understate({initial:0});
state.subscribe(logId);
state.set(increment, {index:true});//*<ID>:0
state.set(increment, {index:true});//*<ID>:1
state.set(increment, {index:true});//*<ID>:2
```

Passing a _truthy_ "index" config option to the **"set"** function will also cause the Understate object to internally index it's state by id. This id can later be used to access any indexed states by passing it to the **"get"** method.

```javascript
var state     = new Understate({initial:0});
state.subscribe((value, id) => setTimeout(_=>state.get(id).then(log), 5000));
state.set(increment, {index:true});//0 (After 5 seconds)
state.set(increment, {index:true});//1 (After 5 seconds)
state.set(increment, {index:true});//2 (After 5 seconds)
```

Passing a _truthy_ index option to the constructor will cause the set function to automatically index values.

```javascript
var logId     = (value, id) => console.log(`${id}:${value}`);
var state     = new Understate({initial:0, index:true});
state.subscribe(logId);
state.set(increment);//*<ID>:0
state.set(increment);//*<ID>:1
state.set(increment, {index:false});//undefined:2
```

If not already indexed, you can index the current state by passing a _truthy_ argument to the id method.

```javascript
var state     = new Understate({initial:0);
state.set(incriment);
var id = state.id(true);
state.get(id).then(log);//1
```

Indexation is a good reason to consider immutability in you application. Using **mutators** (below) that return modified copies of your state without modifying the original ensures that each id points to a uniquely identifiable object.

## Mutators

**Mutator** functions should be pure functions (they have no side effects) that take in a state and return an updated copy of that state without modifying the original (they respect immutability). With that said, these ideas are pretty much programmatically unenforceable, so if you wish to follow this convention, you'll have to take special care to enforce these properties upon your code yourself.

### Signature

A **mutator** should have the following function signature:

```javascript
state => {/*some combination of closure and "state"*/};
```

### Example

This mutator returns the state incremented by 1

```javascript
var increment = state => state + 1;
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
(...parameters) => state => {/*some combination of closure, "parameters", and "state"*/};
//OR
(...parameters) => /*<Mutator>*/;
```

### Example

```javascript
var adder     = y => x => x + y;
var increment = adder(1);
//This is equivalent to the increment function defined above
// adder(y) = y => x => x + y;
// adder(1) = x => x + 1;
```

### Redux Comparison

We can see that a **builder** function and a reducer function from Redux are very similar.

#### Builder Function

```javascript
(...paramters) => previousState => newState
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
var one   = _ => 1;
var state = new Understate();
state.subscribe(log);
state.set(one);//1
state.set(one);//1
state.set(one);//1
```

We can create constant function **builders** as well.

```javascript
var constant  = a => _ => a;
var one       = constant(1);//This is equivalent to "one" defined above.
var state     = new Understate();
state.subscribe(log);
state.set(one);//1
state.set(one);//1
state.set(constant(1));//1
```

### Using Builders

Using different types of **builders** allows us to elegantly express how we modify an application's state.

```javascript
//CounterApplication.js
import Understate from 'Understate';
var log = value => console.log(value);
//Builders
var constant  = a => _ => a;
var adder     = a => b => b + a;
//Mutators
var zero      = constant(0);
var increment = adder(1);
//App
var counter   = new Understate();
counter.subscribe(log);
counter.set(zero);//0
counter.set(increment);//1
counter.set(adder(2));//3
```

```javascript
//messageApplicatiopn.js
import Understate from 'Understate';
var log = value => console.log(value);
//Builders
var constant    = a => _ => a;
var addMessage  = message => messages => messages.concat(message);
var logger = message => {log(message); return message};
//Mutators
var empty       = constant([]);
//App
var messages    = new Understate();
messages.subscribe(log);
messages.set(empty);//[]
messages.set(addMessage('Hello'));//['Hello']
messages.set(addMessage('there'));//['Hello', 'there']
messages.set(addMessage('John.'));//['Hello', 'there', 'John.']
```

#### Decorators

Redux has a concept of _middleware_ used to intercept objects and preform actions such a logging.

Rather, we can simply design our **mutators** to preform these actions.

```javascript
//messageApplicatiopn.js
import Understate from 'Understate';
var receiveLog = value => {console.log(value + ' received.'); return value};
//Builders
var constant    = a => _ => { console.log('Setting constant: ' + a); return a};
var addMessageLog  = message => messages => messages.concat(receiveLog(message));
//Mutators
var empty       = constant([]);
//App
var messages    = new Understate();
messages.set(empty);//'Setting constant:'
messages.set(addMessageLog('Hello'));//'Hello received.'
messages.set(addMessageLog('there'));//'there received.'
messages.set(addMessageLog('John.'));//'John. received.'
```

**Decorators** take in functions return similar functions with enhanced functionality.  They should take a function as one of it's arguments and return a function with the same signature. We apply them to **builder** functions.

```javascript
//messageApplicatiopn.js
import Understate from 'Understate';
//Decorators
var logInput = (target =  _ => _ , preamble = '', conclusion = '') => (...args) => {
    console.log(preamble + String(args) + conclusion);
    return target.apply(this, args);
}
//Builders
var constant    = logInput(a => _ => a, 'Setting constant: ');
var addMessage  = logInput(message => messages => messages.concat(message), '', ' received.');
//Mutators
var empty       = constant([]);
//App
var messages    = new Understate();
messages.set(empty);//'Setting constant:'
messages.set(addMessage('Hello'));//'Hello received.'
messages.set(addMessage('there'));//'there received.'
messages.set(addMessage('John.'));//'John. received.'
```

Note: ECMAcript 8 (2017) has a similar new language feature, also called "decorators", that work in a similar way, but can only be applied to class methods.

## Routers

The final piece of the puzzle is the **router**. It's job is to take "action" from another component in the application, and return a **mutator** function to be applied to the current state. It does this by selecting a **builder** based on an "action" and extracting parameters from that "action".

Strictly speaking, **routers** are **builders**, as they take in a parameter, "action", and return a **mutator** function. They are still; however, a useful abstraction when it comes to deciding how to handle updates.

### Signature

A **router** should have the following signature:

```javascript
action => state => {/*some combination of closure, "action parameters, and "state"*/};
//OR
action => /*<Mutator>*/;
```


### Example

This is an application that uses a sample router.

```javascript
//File: sampleRouters.js

//Schema - Not strictly necessary, but helpful
// {
//   builder     : <String>,
//   parameter   : <Number>
// }
//

//Builders
var add       = a => b => b + a;
var subtract  = a => b => b - a;
var reset     = a => _ => a;

var extractSubject = function(action){
  return action.builder;
}
var extractParamaters = function(action){
  return action.parameter;
}

//Router Implementation: Dictionary
var builders = new Map();
//Available mutation builders
builders.set('add'     ,  add);
builders.set('subtract',  subtract);
builders.set('reset'   ,  reset);
var mapRouter = action => {
  var builder = builders.get(extractSubject(action));
  return builder ? builder(extractParamaters(action)) : _ => _;
};

//Router Implementation: Switch Statement
var switchRouter = action => {
  var builder;
  switch(extractSubject(action)){
    case 'add'      :
      builder = add;
      break;
    case 'subtract' :
      builder = subtract;
      break;
    case 'reset'    :
      builder = reset;
      break;
    default;
    return _ => _;
  }
  return builder(extractParamaters(action));
};
export default {
  mapRouter,
  switchRouter
}
```

```javascript
//File: application.js
import Understate from 'Understate';
import {mapRouter as router} from './sampleRouters.js';
var state = new Understate({initial:0});
state.subscribe(state => console.log(state));
var update = action => state.set(router(action));
export default update;
```

```javascript
//runner.js
import update from './application.js';
var actions = [
  {
    builder    : 'add',
    parameter  : 1
  },
  {
    builder    : 'subtract',
    parameter  : 2
  },
  {
    builder    : 'reset',
    parameter  : 0
  }
];
var action;
while((action = actions.shift())) update(action);
//1
//-1
//0
```

## Asynchronous Mutators

You can modify an Understate instances at creation to take **asynchronous mutators** by passing a truthy "asynchronous" flag to the config function. Like normal (synchronous) **mutators** these functions take a state as an argument. Instead of returning a modified state; however, they return a promise resolved with the modified state.

Note: We can pass an "asynchronous" config option to "set" method to temporarily override the "asynchronous" flag

```javascript
var log = value => console.log(value);
//Builders
var constant    = a => _ => a;
var addMessageAsync  = message => messages => new Promise((resolve, reject)=>{
  if(Math.random() < 0.25) return reject(new Error('Simulated Async Failure'));
  return setTimeout(()=>resolve(messages.concat(message)), 1000);
});
//Mutators
var empty       = constant([]);
//App
var messages    = new Understate({asynchronous:true});
messages.subscribe(log);
messages.set(empty,{asynchronous:false});
messages.set(addMessageAsync('Hello'))
  .then(_=>messages.set(addMessageAsync('there'))
  .then(_=>messages.set(addMessageAsync('John.'))))
.catch(log).catch(log);
//[]
//['Hello']
//['Hello', 'there']
//['Hello', 'there', 'John.']
//OR
//[Error: Simulated Async Failure]
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

action => state => {/*some combination of closure, "action parameters, and "state"*/};
```

This is essentially the same signature as a Redux reducer, who's first had it's parameters reversed, and then had Schönfinkeling applied.

```javascript
action => previousState => newState
```

## API Reference

This API is designed for ECMAScript 6 (2015) and above. It makes no assumptions about the running environment of your application.

### Installation & Import

```javascript
import Understate from 'Understate';
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
