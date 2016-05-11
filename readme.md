#Understate
A simple state manager.

This was inspired by [Redux](https://github.com/rackt/redux/) along with another [old project of mine](https://github.com/johnhenry/polyfill-function).

Understate aims to be similar to Redux, but with some parts abstracted out of the core library using higher-order functional concepts.

In addition, Understate provides a mechanism for indexing and retrieve states by *id*.

Understate does not enforce immutability. However, using immutable objects as values for state has number advantages related to performance, correctness, and reasonability. Consider using it in conjunction with a library such as [Immutable](https://github.com/facebook/immutable-js/).

##About
Understate works by creating objects that ingest *mutator* functions to update their *internal state*.
Wait, what?!

...Okay, let's start over... maybe if we just jump right into it...

###Basic Usage

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

###Indexation

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

##Mutators

**Mutator** functions should be pure functions (they have no side effects) that take in a state and return an updated copy of that state without modifying the original (they respect immutability). With that said, these ideas are pretty much programmatically unenforceable, so if you wish to follow this convention, you'll have to take special care to enforce these properties upon your code yourself.

###Signature

A **mutator** should have the following function signature:

```javascript
state => {/*some combination of closure and "state"*/};
```

###Example

This mutator returns the state incremented by 1

```javascript
var increment = state => state + 1;
```

###Redux Comparison

Setting state using a mutator function in Understate

```javascript
Understate#.set(mutator);
```

Setting state using an action object in Redux

```javascript
Redux#store.dispatch(action);
```

##Builders
Since a **mutator** function only takes in a state, any modifications that are made to it must be based on its closure.

We can take advantage of this by creating mutation **builder** functions that takes, as arguments, a set of parameters and return **mutators** that use the parameters in its closure.

###Signature
A **builder** function should have the following function signature:

```javascript
(...parameters) => state => {/*some combination of closure, "parameters", and "state"*/};
//OR
(...parameters) => /*<Mutator>*/;
```

###Example

```javascript
var adder     = y => x => x + y;
var increment = adder(1);
//This is equivalent to the increment function defined above
// adder(y) = y => x => x + y;
// adder(1) = x => x + 1;
```

###Redux Comparison

We can see that a **builder** function and a reducer function from Redux are very similar.

####Builder Function

```javascript
(...paramters) => previousState => newState
```

####Reducer Function

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

###Initialization with Constant Function Builders

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

###Using Builders

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

####Decorators

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

##Routers

The final piece of the puzzle is the **router**. It's job is to take "action" from another component in the application, and return a **mutator** function to be applied to the current state. It does this by selecting a **builder** based on an "action" and extracting parameters from that "action".

Strictly speaking, **routers** are **builders**, as they take in a parameter, "action", and return a **mutator** function. They are still; however, a useful abstraction when it comes to deciding how to handle updates.

###Signature

A **router** should have the following signature:

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

##Asynchronous Mutators

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



###Redux Comparison

####Actions

Actions are similar, but are less flexible in Redux


Setting state using an "action" -- Here, the "action" mustn't be of any specific format -- its schema is defined by how the router interprets it


```javascript
Understate#.set(router(action));
```

Setting state in Redux using an action -- Here, an action is a loosely formatted JSON object with a mandatory "type" attribute

```javascript
Redux#store.dispatch(action);
```

####Reducers

**Routers/builders** are essentially reducers from Redux that have been abstracted out of the core library.

Recall the function signature a **router**:

```javascript

action => state => {/*some combination of closure, "action parameters, and "state"*/};
```

This is essentially the same signature as a Redux reducer, who's first had it's parameters reversed, and then had Schönfinkeling applied.

```javascript
action => previousState => newState
```

##Application Programming Interface

This API is written for ECMASCRIPT 6 (2015). It makes no assumptions about the running environment of the application.

###Import
```javascript
import Understate from 'Understate';
```

###Consturor -- new Understate({initial:any=undefined, index:boolean=false, asynchronous:boolean=false});

Create a new Understate instance

```javascript
var state = new Understate();
```

Create a new Understate instance with an initial value

```javascript
var state = new Understate({initial:/*sone initial value*/});
```

Create a new Understate instance that indexes state by default

```javascript
var state = new Understate({index:true});
```

Create a new Understate instance that expects asynchronous mutators.

```javascript
var state = new Understate({asynchronous:true});
```

###Instance Methods

These are methods attached to an instance.
For this section, you may assume "state" is an available instance of Understate.

####Understate#set(mutator:function, {index:boolean=instance#index, asynchronous:boolean=instance#index});

Update the internal state of an Understate instance with a **mutator** (see above) function.

```javascript
var quoter = state => '"' + String() + '"';
state.set(quoter).then(state=>console.log(state));
```

Update the internal state of an Understate instance with a mutator function, index it, and pass it's id along with state in the promise resolution.

```javascript
var quoter = state => '"' + String() + '"';
state.set(quoter, {index:true}).then((state, id)=>console.log(id, state));
```

Update the internal state of an Understate instance with an asynchronous mutator function, index it, and pass it's id along with state in the promise resolution.

```javascript
var promiseMutator = state => new Promise(_=>_(state));
state.set(promiseMutator, {asynchronous:true}).then(state=>console.log(state));
```

####Understate#s(mutator:function, {index:boolean=instance#index, asynchronous:boolean=instance#index});

Same as Understate#set (See above), but returns the original object for chaining.

```javascript
state
  .s(/*first mutator*/)
  .s(/*second mutator*/)
  .s(/*third mutator*/);
```

Note: There is no guarantee about the order in which these chained methods are executed.

####Understate#id();

Get the id of the current state.

```javascript
state.id();
```
Note: this method returns the id directly and not a promise.

####Understate#id(id:boolean);

Get the id of the current state and also index it if not already indexed.

```javascript
state.id(true);
```
Note: this method returns the id directly and not a promise.

####Understate#get();

Retrieve the current state.

```javascript
state.get().then(state=>console.log(state));
```

####Understate#get(index:string);

Retrieve an indexed state by id.

```javascript
state.get(/*some index*/).then(state=>console.log(state));
```

####Understate#subscribe(subscriber:function);

Subscribe to changes in a state

```javascript
state.subscribe(state=>console.log(state));
```

#####Understate#subscribe(subscriber:function).unsubscribe();

The object returned by "subscribe" is linked to the original via prototype-chain. Methods called on the original will affect the new object and vice-versa. In addition, the returned object has an "unsubscribe" method that cancels further updates from the original function passed to "subscribe".

```javascript
state.subscribe(state=>console.log(state)).unsubscribe();
```
#####Subscribe Implementation Notes

The current implementation uses tracks subscriptions using a Set, resulting in a few "gotchas":

######Uniqueness

The following would result in multiple subscriptions:

```javascript
var logEmitter = _ => state=>console.log(state);
state.subscribe(logEmitter());
state.subscribe(logEmitter());
state.subscribe(logEmitter());
```

while the following will only result in one

```javascript
var log = state=>console.log(state)
state.subscribe(log);
state.subscribe(log);
state.subscribe(log);
```
as each 'log' is the same object.

######Order

There is no guarantee as to the order in which subscriptions are called.

```javascript
state.subscribe(state=>console.log('Or does this?'));
state.subscribe(state=>console.log('Does this happen first?'));
state.set(/*some mutator*/);
//(Might Log: 'Does this happen first?' 'Or does this?')
```
