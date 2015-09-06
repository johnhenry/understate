#Understate
State Manager

##About
Understate works by creating objects that ingest mutator functions to update its internal state.
Wait, what?!
...Okay, let's start over...

###Basic Usage

When you first create a Understate object, it has an initial internal value.
That can be accesses via the "get" method.

```javascript
var log = value => console.log(value);
var state = new Understate({});
state.get().then(log);//undefined
```

Note: I'm passing an empty config object here into the constructor function. I don't think this should necessary, but, with my current es6 transplier, it an error is thrown without it. No big deal, maybe we'll come back to this somewhere down the line...

You can also pass an initial value when creating a Understate object.

```javascript
var log = value => console.log(value);
var state = new Understate({initial:0});
state.get().then(log);//0
```

You can update the internal value by passing a mutator function to the "set" method.

```javascript
var log = value => console.log(value);
var increment = x => x + 1;
var state = new Understate({initial:0});
state.get().then(log);//0
state.set(increment).then(log);//1
```

You can subscribe to updates with the "subscribe" function.

```javascript
var log = value => console.log(value);
var increment = x => x + 1;
var state = new Understate({initial:0});
state.subscribe(log);
state.set(increment);//1
state.set(increment);//2
state.set(increment);//3
```


You can unsubscribe to updates by calling the the "unsubscribe" on the object returned by the subscribe method.

```javascript
var log = value => console.log(value);
var increment = x => x + 1;
var state = new Understate({initial:0});
var unsubscriber = state.subscribe(log);
state.set(increment);//1
state.set(increment);//2
unsubscriber.unsubscribe();
state.set(increment);//(Nothing logged)
```

###Memorization

Understate objects track their state internally.

Each Understate object associates an id with it's value whenever it's value us update. This can be accessed from the "id" method.

```javascript
var log = value => console.log(value);
var increment = x => x + 1;
var state = new Understate({initial:0});
log(state.id());//*<ID>
state.set(increment).then(x=>console.log(state.id()));//*<ID(Different)>
```

Passing a second, truthy argument to the "set" function will cause its id to be emitted in the function passed to subscribe.

```javascript
var logId = (value, id) => console.log(`${id}:${value}`);
var increment = x => x + 1;
var state = new Understate({initial:0});
state.subscribe(logId);
state.set(increment, true);//*<ID>:0
state.set(increment, true);//*<ID>:1
state.set(increment, true);//*<ID>:2
```

In addition, passing a second, truthy argument to the "set" function will also cause the Understate object to internally index it's state by id. This id can later be used to access any indexed states by passing it to the "get" method.

```javascript
var log = value => console.log(value);
var increment = x => x + 1;
var state = new Understate({initial:0});
state.subscribe((value, id) =>{
  setTimeout(_=>state.get(id).then(log), 5000)
});
state.set(increment, true);//0 (After 5 seconds)
state.set(increment, true);//1 (After 5 seconds)
state.set(increment, true);//2 (After 5 seconds)
```

Passing a truthy index option to the constructor will cause the set function to automatically index values.

```javascript
var logId = (value, id) => console.log(`${id}:${value}`);
var increment = x => x + 1;
var state = new Understate({initial:0, index:true});
state.subscribe(logId);
state.set(increment);//*<ID>:0
state.set(increment);//*<ID>:1
state.set(increment, false);//undefined:2
```

If not already indexd, you can index the current state by passing a truthy argument to the id method.


```javascript
var log = value => console.log(value);
var increment = x => x + 1;
var state = new Understate({initial:0);
state.set(incriment);
var id = state.id(true);
state.get(id).then(log);//1
```

##Mutators and Mutator Builders
Mutator functions SHOULD be pure functions (no side effects) that take in a state and return an updated copy of that state without modifying the original (immutability).

```javascript
var mutatorFunction = state => {/*some combination of closure and "state"*/};
var increment = x => x + 1;
```

Since a mutator function only takes in a state, any modifications that are made to it must be based on its closure.

We can take advantage of this by creating builder functions that take, as arguments, a set of parameters and returns functions of state that use the parameters in its closure.

```javascript
var mutatorFunctionBuilder = (...parameters) => state =>{/*some combination of closure, "parameters", "state"*/};
var adder = a => b => a + b;
var increment = adder(1);//This is equivalent to the increment function defined above
```

It's often useful to set a state rather than modify it. In this case, we
can use a constant function.

```javascript
var log = value => console.log(value);
var one = x => 1;
var state = new Understate();
state.subscribe(log);
state.set(one);//1
state.set(one);//1
state.set(one);//1
```

We can create constant function builders as well.

```javascript
var log = value => console.log(value);
var constant = a => () => a;
var one = constant(1);//This is equivalent to one
var state = new Understate();
state.subscribe(log);
state.set(one);//1
state.set(one);//1
state.set(constant(1));//1
```

Using mutators and builders in this way allows us to elegantly express how we modify our state;

```javascript
var log = value => console.log(value);
//Mutator Builders
var constant = a => () => a;
var adder = a => b => a + b;
//Mutators
var negater = a =>-a;

var one = builderConstant(1);//This is equivalent to one
var state = new Understate();
state.subscribe(log);
state.set(constant(2));//2
state.set(adder(3));//5
state.set(negater);//-5

//Mutator Builders
var addMessage = message => b => {b.concat(message);};
var messages = new Understate({initial:[]});
messages.subscribe(log);
messages.set(addMessage('Hello'));//['Hello']
messages.set(addMessage('there'));//['Hello', 'there']
messages.set(addMessage('John'));//['Hello', 'there', 'John']
```

##Immutability
While not necessary to use objects, using immutable objects as values for state has number advantages related to performance and correctness.

##API

###import
Import via es6

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

Create new Understate instance with an initial value
```javascript
var state = new Understate({initial:/*sone initial value*/});
```

Create new Understate that indexes state by default
```javascript
var state = new Understate({index:true});
```

###Instance Methods

####Understate#set(mutator:function);
Mutate the internal state of an Understate instance with a mutator function.

```javascript
var quoter = state => '"' + String() + '"';
state.set().then(state=>console.log(state));
```


####Understate#set(mutator:function, index:boolean);
Mutate the internal state of an Understate instance with a mutator function, index it, and pass it's id along with state in the promise resolution.

```javascript
var quoter = state => '"' + String() + '"';
state.set().then((state, id)=>console.log(id, state));
```

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
Retrieve the an index state by id.

```javascript
state.get(/*some index*/).then(state=>console.log(state));
```

####Understate#subscribe(subscription:function);
Subscribe to changes in a state

```javascript
state.subscribe(state=>console.log(state));
```
