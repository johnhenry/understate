# 🥚 Easter Egg Discovery Guide 🥚

Congratulations on finding the secret easter eggs in Understate!

## How to Access the Easter Eggs

### Method 1: The Emoji Method
If your environment supports emoji method names, try this:

```javascript
import Understate from 'understate';
const state = new Understate();
state.🥚(); // This will reveal the secret!
```

### Method 2: Direct Import
Import the easter egg utilities directly:

```javascript
import {
    dramaticMutator,
    understate,
    schonfinkel,
    immutabilityPolice,
    randomFactMutator
} from 'understate/src/easter-egg';
```

## Easter Egg Features

### 🎭 Dramatic Mutator
Make your state changes DRAMATIC!

```javascript
const state = new Understate({initial: 'boring'});
state.subscribe(console.log);
state.set(dramaticMutator('EXCITING!'));
// Watch the drama unfold in your console!
```

### 🤔 The Understate Function
The most meta function ever - it UNDERstates everything!

```javascript
const state = new Understate({initial: 'ok'});
state.set(understate('AMAZING'));  // Returns: 'pretty ok'
state.set(understate('TERRIBLE')); // Returns: 'not great'
state.set(understate('LOVE'));     // Returns: 'like'
```

### 🎓 Schönfinkel Appreciation
Named after Moses Schönfinkel (mentioned in the readme!), this automatically curries functions:

```javascript
const add = (a, b, c) => a + b + c;
const curriedAdd = schonfinkel(add);

curriedAdd(1)(2)(3); // Returns: 6
curriedAdd(1, 2)(3); // Also returns: 6
curriedAdd(1)(2, 3); // Still returns: 6
```

### 🚨 Immutability Police
Enforces immutability like a boss:

```javascript
const badMutator = (state) => {
    state.value = 'modified'; // This mutates!
    return state;
};

const goodMutator = (state) => ({...state, value: 'modified'}); // This is good!

state.set(immutabilityPolice(badMutator));  // Triggers a warning
state.set(immutabilityPolice(goodMutator)); // Gets approval
```

### 🤓 Random Fact Mutator
Learn something new with every state change:

```javascript
state.set(randomFactMutator('new value'));
// Console: "Did you know? The word 'state' comes from the Latin 'status' meaning 'condition'"
```

### 🎊 Secret Sequence
Use the `understate` function with these values in order to unlock a special message:
1. `understate('AMAZING')`
2. `understate('TERRIBLE')`
3. `understate('FANTASTIC')`

```javascript
state.set(understate('AMAZING'));
state.set(understate('TERRIBLE'));
state.set(understate('FANTASTIC'));
// A wild congratulations message appears!
```

## Why These Easter Eggs?

- **dramaticMutator**: Because state management doesn't have to be boring!
- **understate**: A playful nod to the library's name
- **schonfinkel**: Honoring the mathematician mentioned in the readme
- **immutabilityPolice**: Gently reminding developers about best practices
- **randomFactMutator**: Education disguised as fun
- **Secret Sequence**: For those who explore deeply

## Philosophy

Just like the Understate library itself aims to be elegant and understated, these easter eggs are hidden gems that reward curious developers who dig deeper into the codebase. They're functional, fun, and educational - much like the library's approach to state management!

Enjoy! 🎉
