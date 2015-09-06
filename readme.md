#Understate
A simple state manager.

This was inspired by [Redux](https://github.com/rackt/redux/) along with another [old project of mine](https://github.com/johnhenry/polyfill-function).

Understate aims to be similar to Redux, but with some parts abstracted out of the core library.

In addition, Understate provides a mechanism for indexing and retrieve states by id.

Understate does not enforce immutability. However, using immutable objects as values for state has number advantages related to performance, correctness, and reasonability. Consider using it in conjunction with a library such as [Immutable](https://github.com/facebook/immutable-js/).

##About
Understate works by creating objects that ingest *mutator* functions to update their *internal state*.
Wait, what?!

...Okay, let's start over... maybe if we just jump right in...

###Basic Usage

When you first create an Understate object, it has an initial internal value.
That can be accesses via the "get" method.

```javascript
import Understate from 'Understate';
var log   = value => console.log(value);
var state = new Understate({});
state.get().then(log);//undefined
```

Note: I'm passing an empty config object here into the constructor. I don't think this _should_ be necessary, but, with my current es6 transplier, my test throws an errow without it. No big deal, maybe we'll come back to this somewhere down the line...

You can also pass an initial value when creating a Understate object.

```javascript
var state = new Understate({initial: 0});
state.get().then(log);//0
```

You can update the internal value by passing a *mutator* (See Below) function to the "set" method.

```javascript
var increment = x => x + 1;
var state     = new Understate({initial: 0});
state.get().then(log);//0
state.set(increment).then(log);//1
```

You can subscribe to updates with the "subscribe" function.

```javascript
var state     = new Understate({initial: 0});
state.subscribe(log);
state.set(increment);//1
state.set(increment);//2
state.set(increment);//3
```

You can unsubscribe to updates by calling the "unsubscribe" method on the object returned by the subscribe method.

```javascript
var state         = new Understate({initial: 0});
var unsubscriber  = state.subscribe(log);
state.set(increment);//1
state.set(increment);//2
unsubscriber.unsubscribe();
state.set(increment);//(Nothing logged)
```

###Memorization

Understate objects track their state internally.

Each Understate object associates an id with it's value whenever it's value us update. This can be accessed from the "id" method.

```javascript
var state     = new Understate({initial:0});
log(state.id());//*<ID>
state.set(increment).then(x=>console.log(state.id()));//*<ID(Different)>
```

Passing a second, truthy argument to the "set" function will cause its id to be emitted in the function passed to subscribe.

```javascript
var logId     = (value, id) => console.log(`${id}:${value}`);
var state     = new Understate({initial:0});
state.subscribe(logId);
state.set(increment, true);//*<ID>:0
state.set(increment, true);//*<ID>:1
state.set(increment, true);//*<ID>:2
```

In addition, passing a second, truthy argument to the "set" function will also cause the Understate object to internally index it's state by id. This id can later be used to access any indexed states by passing it to the "get" method.

```javascript
var state     = new Understate({initial:0});
state.subscribe((value, id) => setTimeout(_=>state.get(id).then(log), 5000));
state.set(increment, true);//0 (After 5 seconds)
state.set(increment, true);//1 (After 5 seconds)
state.set(increment, true);//2 (After 5 seconds)
```

Passing a truthy index option to the constructor will cause the set function to automatically index values.

```javascript
var logId     = (value, id) => console.log(`${id}:${value}`);
var state     = new Understate({initial:0, index:true});
state.subscribe(logId);
state.set(increment);//*<ID>:0
state.set(increment);//*<ID>:1
state.set(increment, false);//undefined:2
```

If not already indexed, you can index the current state by passing a truthy argument to the id method.

```javascript
var state     = new Understate({initial:0);
state.set(incriment);
var id = state.id(true);
state.get(id).then(log);//1
```

##Mutators

*Mutator* functions SHOULD be pure functions (no side effects) that take in a state and return an updated copy of that state without modifying the original (immutability).

###Signature

A mutator should have the following function signature:

```javascript
state => {/*some combination of closure and "state"*/};
```

###Example

```javascript
var increment = state => state + 1;//This mutator returns the state incrimented by 1;
```

###Redux Comparison

Similar concepts in [Redux]():
Understate()
```javascript
//Setting state using a mutator function in Understate
Understate#.set(mutator);

//Setting state using an action object in Redux
Redux#store.dispatch(action);
```

##Builders
Since a mutator function only takes in a state, any modifications that are made to it must be based on its closure.

We can take advantage of this by creating mutation *builder* functions that takes, as arguments, a set of parameters and return functions of state that use the parameters in its closure.

###Signature
A builder function should have the following function signature:

```javascript
(...parameters) => state => {/*some combination of closure, "parameters", and "state"*/};
//OR
(...parameters) => /*<Mutator>*/;
```

###Example

```javascript
var adder     = a => b => b + a;
var increment = adder(1);//This is equivalent to the increment function defined above
```

###Redux Comparison

Similar concepts in [Redux]():

```javascript
//Builder signature
(...paramters) => previousState => newState
//We can see that a builder function and a reducer function are very similar.

//Reducer signature in Redux
(previousState, action) => newState
//If you were to reverse the parameters in a reducer...
(action, previousState) => newState
//and then Schönfinkel it
action => previousState => newState
//you'd end up with a builder that takes an action as it's parameter
```
###Initialization with constant function builders

It's often useful to set a state rather than modify it. In this case, we
can use a constant function.

```javascript
var one   = x => 1;
var state = new Understate({});
state.subscribe(log);
state.set(one);//1
state.set(one);//1
state.set(one);//1
```

We can create constant function builders as well.

```javascript
var constant  = a => () => a;
var one       = constant(1);//This is equivalent to "one" defined above.
var state     = new Understate({});
state.subscribe(log);
state.set(one);//1
state.set(one);//1
state.set(constant(1));//1
```

###Using Builders

Using different types of builders allows us to elegantly express how we modify an application's state.

```javascript
//CounterApplication.js
import Understate from 'Understate';
var log       = value => console.log(value);
//Builders
var constant  = a => _ => a;
var adder     = a => b => b + a;
//Mutators
var zero      = constant(0);
var increment = adder(1);
//App
var counter   = new Understate({});
counter.subscribe(log);
counter.set(zero);//0
counter.set(increment);//1
counter.set(adder(2));//3
```

```javascript
//messageApplicatiopn.js
import Understate from 'Understate';
var log         = value => console.log(value);
//Builders
var constant    = a => _ => a;
var addMessage  = message => messages => messages.concat(message);
//Mutators
var empty       = constant([]);
//App
var messages    = new Understate({});
messages.subscribe(log);
messages.set(empty);//[]
messages.set(addMessage('Hello'));//['Hello']
messages.set(addMessage('there'));//['Hello', 'there']
messages.set(addMessage('John.'));//['Hello', 'there', 'John.']
```

##Routers

The final piece of the puzzle is the *router*. It's job is to take "action" from another component in the application, and return a mutator function to be applied to the current state. It does this by selecting a builders based on an action and extracting parameters from that action.

In fact, Routers are, strictly speaking, builders, as they take in a parameter, "action", and return a mutator function. They are still; however, a useful abstraction when it comes to deciding how to handle updates.

###Signature

A router should have the following signature:

```javascript
action => state => {/*some combination of closure, "action parameters, and "state"*/};
//OR
action => /*<Mutator>*/;
```


###Example

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
var update = action => state.set(router(action);
export default update
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

###Redux Comparison

####Actions

Actions are similar, but are less flexible for Redux

```javascript
//Setting state using an action : Here, the action mustn't be of any specific format -- its schema is defined by how the router interprets it
Understate#.set(router(action));
//

//Setting state in Redux using an action : Here, an action is a loosely formatted JSON object with a mandatory "type" attribute
Redux#store.dispatch(action);
```

####Reducers

Routers/Builders Are Essentially Reducers from Redux that have been abstracted out of the core library.

```javascript
//Recall the function signature a router
action => state => {/*some combination of closure, "action parameters, and "state"*/};

//This is the same signature as a Redux reducer, who's first had it's parameters reversed, and then had Schönfinkeling applied
action => previousState => newState
```

##API
This API Is written for ECMASCRIPT 6.0 standard. It makes no assumptions about the running environment of the application.

###import
```javascript
import Understate from 'Understate';
```

###Consturor new Understate({initial:any=undefined, index:boolean=false});

Create new Understate instance

```javascript
var state = new Understate({});
```

Create new Understate instance with an initial value

```javascript
var state = new Understate({initial:/*sone initial value*/});
```

Create new Understate that indexes state by default

```javascript
var state = new Understate({index:true});
```

###Instance Methods

These are methods attached to an instance.
For this section, you may assume "state" is an available insance of Understate.

####Understate#set(mutator:function);

Update the internal state of an Understate instance with a *mutator* (see above) function.

```javascript
var quoter = state => '"' + String() + '"';
state.set().then(state=>console.log(state));
```

####Understate#set(mutator:function, index:boolean);

Update the internal state of an Understate instance with a mutator function, index it, and pass it's id along with state in the promise resolution.

```javascript
var quoter = state => '"' + String() + '"';
state.set().then((state, id)=>console.log(id, state));
```

####Understate#s(...);

Same as Understate#set (See above), but returns the original object. Useful for chaining.


####Understate#id();

Get the id of the current state.

```javascript
state.id();
```
Note: this method returns the id directly and not a promise.

####Understate#id(index:string);

Get the id of the current state and also index it if not already indexed.

```javascript
state.id(/*some index*/);
```
Note: this method returns the id directly and not a promise.

####Understate#get();

Retrieve the current state.

```javascript
state.get().then(state=>console.log(state));
```

####Understate#get(id:boolean);

Retrieve an indexed state by id.

```javascript
state.get(/*some index*/).then(state=>console.log(state));
```

####Understate#subscribe(subscriber:function);

Subscribe to changes in a state

```javascript
state.subscribe(state=>console.log(state));
```

Note: The object returned by unsubscribe is linked to the original. Methods called on the original will affect the new object and vice versa, though the original will not have an unsubscribe method.

```javascript
var s = new Reinstate({});
var t = s.subscribe(_=>console.log(_));
t.set(constant(0), true);//0
s.set(add(1));//1
t.set(add(1));//2
s.set(add(1));//3
t.set(add(1));//4
s.set(add(1));//5
t.unsubscribe();
s.set(add(1));//(Logs Nothing)
t.set(add(1));//(Logs Nothing)
s.unsubscribe();//(Throws Error)
```

Note: The current implementation uses sets.
Meaning the following would result in two subscriptions:

```javascript
state.subscribe(state=>console.log(state));
state.subscribe(state=>console.log(state));
```

while the following will only result in one

```javascript
var log = state=>console.log(state)
state.subscribe(log);
state.subscribe(log);
state.subscribe(log);
state.subscribe(log);
state.subscribe(log);
```

as each 'log' is the same object
