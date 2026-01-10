/**
 * 🥚 EASTER EGG 🥚
 *
 * Congratulations on finding this hidden gem!
 *
 * This file contains a secret mutator builder that makes state management...
 * dramatically more dramatic!
 *
 * Usage:
 *   import { dramaticMutator } from 'understate/src/easter-egg';
 *
 *   const state = new Understate({initial: 'hello'});
 *   state.subscribe(console.log);
 *   state.set(dramaticMutator('WORLD'));
 *
 * Try it and watch the magic happen! ✨
 */

/**
 * Adds dramatic pauses and excitement to your state updates
 * Because every state change deserves a moment in the spotlight!
 */
export const dramaticMutator = (newValue) => (oldState) => {
    console.log('🎬 STATE UPDATE IN PROGRESS...');
    console.log('🎭 Old state:', oldState);
    console.log('⏳ Preparing dramatic transformation...');
    console.log('✨ *drum roll* ✨');
    console.log('🎉 New state:', newValue);
    console.log('👏 MAGNIFICO! 👏');
    return newValue;
};

/**
 * The legendary "understate" function - the most understated function ever
 * It does exactly what the library name promises: it UNDERstates everything
 */
export const understate = (value) => (_) => {
    const understated = {
        'AMAZING': 'pretty ok',
        'TERRIBLE': 'not great',
        'LOVE': 'like',
        'HATE': 'not a fan',
        'INCREDIBLE': 'decent',
        'AWFUL': 'could be better',
        'FANTASTIC': 'fine',
        'HORRIBLE': 'meh'
    };

    if (typeof value === 'string') {
        const upper = value.toUpperCase();
        if (understated[upper]) {
            console.log(`🤔 "${value}" is a bit much... let's call it "${understated[upper]}" instead`);
            return understated[upper];
        }
    }

    return value;
};

/**
 * The Schönfinkel appreciation function
 * Named after Moses Schönfinkel (mentioned in the readme!)
 * Automatically curries any function you pass to it
 */
export const schonfinkel = (fn) => {
    const curry = (f, arity = f.length, ...args) => {
        if (args.length >= arity) {
            return f(...args);
        }
        return (...newArgs) => curry(f, arity, ...args, ...newArgs);
    };

    console.log('🎓 Professor Schönfinkel approves of your currying!');
    return curry(fn);
};

/**
 * Secret sequence detector
 * Call state.set() with these mutators in order to unlock a message:
 * understate('AMAZING') -> understate('TERRIBLE') -> understate('FANTASTIC')
 */
let secretSequence = [];
export const trackSecret = (mutatorName) => {
    secretSequence.push(mutatorName);
    if (secretSequence.length > 3) {
        secretSequence.shift();
    }

    if (JSON.stringify(secretSequence) === JSON.stringify(['AMAZING', 'TERRIBLE', 'FANTASTIC'])) {
        console.log('');
        console.log('🎊 ═══════════════════════════════════════════════════ 🎊');
        console.log('   🏆 CONGRATULATIONS! You found the secret sequence! 🏆');
        console.log('   You truly understand the art of UNDERstatement!');
        console.log('   State management has never been so beautifully subtle.');
        console.log('🎊 ═══════════════════════════════════════════════════ 🎊');
        console.log('');
        secretSequence = [];
    }
};

/**
 * The "immutability inspector" - because immutability is serious business
 * Checks if you're actually following immutability principles
 */
export const immutabilityPolice = (mutator) => (state) => {
    const originalState = JSON.stringify(state);
    const newState = mutator(state);

    if (JSON.stringify(state) !== originalState) {
        console.warn('🚨 IMMUTABILITY VIOLATION DETECTED! 🚨');
        console.warn('You mutated the original state! For shame!');
        console.warn('Consider using a library like Immutable.js (as suggested in the readme)');
    } else {
        console.log('✅ Immutability check passed! You are a responsible developer.');
    }

    return newState;
};

/**
 * Random state facts - because who doesn't love random trivia?
 */
const stateFacts = [
    'Did you know? The word "state" comes from the Latin "status" meaning "condition"',
    'Fun fact: Redux was created in 2015 by Dan Abramov',
    'Trivia: Moses Schönfinkel invented currying in the 1920s (though it\'s named after Haskell Curry)',
    'Did you know? Immutability makes time-travel debugging possible',
    'Fun fact: The observer pattern (used in subscriptions) dates back to the 1990s',
    'Trivia: Pure functions always return the same output for the same input',
];

export const randomFactMutator = (value) => (state) => {
    const fact = stateFacts[Math.floor(Math.random() * stateFacts.length)];
    console.log('🤓', fact);
    return value;
};

// Export all the secrets
export default {
    dramaticMutator,
    understate,
    schonfinkel,
    trackSecret,
    immutabilityPolice,
    randomFactMutator
};
