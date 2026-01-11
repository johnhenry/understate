/**
 * Unit Tests for Understate Core Functionality
 *
 * Tests cover:
 * - Constructor initialization
 * - set/get operations
 * - subscribe/unsubscribe lifecycle
 * - Basic state management
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Understate, generateId, validateEmail } from '../../src/index.js';

//=============================================================================
// Utility Function Tests
//=============================================================================

describe('generateId', () => {
  test('should generate a unique string ID', () => {
    const id = generateId();
    assert.strictEqual(typeof id, 'string');
    assert.ok(id.length > 0);
    assert.ok(id.length <= 15);
  });

  test('should generate different IDs on multiple calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    assert.notStrictEqual(id1, id2);
  });

  test('should only contain numeric characters', () => {
    const id = generateId();
    assert.ok(/^\d+$/.test(id));
  });
});

describe('validateEmail', () => {
  test('should return true for valid email addresses', () => {
    assert.strictEqual(validateEmail('user@example.com'), true);
    assert.strictEqual(validateEmail('test.user@example.com'), true);
    assert.strictEqual(validateEmail('user+tag@example.co.uk'), true);
    assert.strictEqual(validateEmail('firstname.lastname@company.org'), true);
    assert.strictEqual(validateEmail('user_123@test-domain.com'), true);
  });

  test('should return false for invalid email addresses', () => {
    assert.strictEqual(validateEmail('invalid.email'), false);
    assert.strictEqual(validateEmail('@example.com'), false);
    assert.strictEqual(validateEmail('user@'), false);
    assert.strictEqual(validateEmail('user @example.com'), false);
    assert.strictEqual(validateEmail('user@.com'), false);
    assert.strictEqual(validateEmail('user..name@example.com'), false);
  });

  test('should return false for empty string', () => {
    assert.strictEqual(validateEmail(''), false);
  });

  test('should throw TypeError when email is null', () => {
    assert.throws(
      () => validateEmail(null),
      {
        name: 'TypeError',
        message: /email parameter is required/
      }
    );
  });

  test('should throw TypeError when email is undefined', () => {
    assert.throws(
      () => validateEmail(undefined),
      {
        name: 'TypeError',
        message: /email parameter is required/
      }
    );
  });

  test('should throw TypeError when email is not a string', () => {
    assert.throws(
      () => validateEmail(123),
      {
        name: 'TypeError',
        message: /email parameter must be a string/
      }
    );
  });

  test('should throw TypeError when email is an array', () => {
    assert.throws(
      () => validateEmail(['user@example.com']),
      {
        name: 'TypeError',
        message: /email parameter must be a string/
      }
    );
  });

  test('should throw TypeError when email is an object', () => {
    assert.throws(
      () => validateEmail({ email: 'user@example.com' }),
      {
        name: 'TypeError',
        message: /email parameter must be a string/
      }
    );
  });

  test('should validate emails with special characters in local part', () => {
    assert.strictEqual(validateEmail('user!name@example.com'), true);
    assert.strictEqual(validateEmail('user#name@example.com'), true);
    assert.strictEqual(validateEmail('user$name@example.com'), true);
    assert.strictEqual(validateEmail('user%name@example.com'), true);
  });

  test('should validate emails with hyphens in domain', () => {
    assert.strictEqual(validateEmail('user@test-domain.com'), true);
    assert.strictEqual(validateEmail('user@my-test-site.co.uk'), true);
  });

  test('should validate emails with numbers in domain', () => {
    assert.strictEqual(validateEmail('user@test123.com'), true);
    assert.strictEqual(validateEmail('user@123test.org'), true);
  });

  test('should reject emails with consecutive dots', () => {
    assert.strictEqual(validateEmail('user..name@example.com'), false);
    assert.strictEqual(validateEmail('user@example..com'), false);
  });

  test('should reject emails starting or ending with dot', () => {
    assert.strictEqual(validateEmail('.user@example.com'), false);
    assert.strictEqual(validateEmail('user.@example.com'), false);
  });

  test('should reject emails with invalid characters', () => {
    assert.strictEqual(validateEmail('user name@example.com'), false);
    assert.strictEqual(validateEmail('user@exam ple.com'), false);
    assert.strictEqual(validateEmail('user<>@example.com'), false);
  });
});

//=============================================================================
// Constructor Initialization Tests
//=============================================================================

describe('Understate Constructor', () => {
  test('should create instance with default values', () => {
    const state = new Understate();
    assert.ok(state instanceof Understate);
    assert.strictEqual(typeof state._getState, 'function');
    assert.strictEqual(typeof state._getId, 'function');
    assert.strictEqual(state._index, false);
    assert.strictEqual(state._asynchronous, false);
  });

  test('should initialize with provided initial state', async () => {
    const initialValue = 42;
    const state = new Understate({ initial: initialValue });
    const value = await state.get();
    assert.strictEqual(value, initialValue);
  });

  test('should initialize with object as initial state', async () => {
    const initialValue = { count: 0, name: 'test' };
    const state = new Understate({ initial: initialValue });
    const value = await state.get();
    assert.deepStrictEqual(value, initialValue);
  });

  test('should initialize with array as initial state', async () => {
    const initialValue = [1, 2, 3];
    const state = new Understate({ initial: initialValue });
    const value = await state.get();
    assert.deepStrictEqual(value, initialValue);
  });

  test('should initialize with null as initial state', async () => {
    const state = new Understate({ initial: null });
    const value = await state.get();
    assert.strictEqual(value, null);
  });

  test('should initialize with undefined as initial state', async () => {
    const state = new Understate({ initial: undefined });
    const value = await state.get();
    assert.strictEqual(value, undefined);
  });

  test('should set index flag when provided', () => {
    const state = new Understate({ index: true });
    assert.strictEqual(state._index, true);
  });

  test('should set asynchronous flag when provided', () => {
    const state = new Understate({ asynchronous: true });
    assert.strictEqual(state._asynchronous, true);
  });

  test('should initialize with all config options', () => {
    const state = new Understate({
      initial: 100,
      index: true,
      asynchronous: true
    });
    assert.strictEqual(state._index, true);
    assert.strictEqual(state._asynchronous, true);
  });

  test('should throw TypeError for non-object config', () => {
    assert.throws(
      () => new Understate('invalid'),
      {
        name: 'TypeError',
        message: /config parameter must be an object/
      }
    );
  });

  test('should throw TypeError for array config', () => {
    assert.throws(
      () => new Understate([1, 2, 3]),
      {
        name: 'TypeError',
        message: /config parameter must be an object/
      }
    );
  });

  test('should throw TypeError for non-boolean index', () => {
    assert.throws(
      () => new Understate({ index: 'true' }),
      {
        name: 'TypeError',
        message: /index parameter must be a boolean/
      }
    );
  });

  test('should throw TypeError for non-boolean asynchronous', () => {
    assert.throws(
      () => new Understate({ asynchronous: 1 }),
      {
        name: 'TypeError',
        message: /asynchronous parameter must be a boolean/
      }
    );
  });

  test('should create subscriptions Set', () => {
    const state = new Understate();
    assert.ok(state._subscriptions instanceof Set);
    assert.strictEqual(state._subscriptions.size, 0);
  });

  test('should create indexed Map', () => {
    const state = new Understate();
    assert.ok(state._indexed instanceof Map);
  });

  test('should index initial state when index is true', () => {
    const state = new Understate({ initial: 42, index: true });
    assert.strictEqual(state._indexed.size, 1);
    const id = state._getId();
    assert.strictEqual(state._indexed.get(id), 42);
  });

  test('should generate initial ID', () => {
    const state = new Understate({ initial: 10 });
    const id = state._getId();
    assert.strictEqual(typeof id, 'string');
    assert.ok(id.length > 0);
  });
});

//=============================================================================
// Set Operation Tests
//=============================================================================

describe('Understate.set()', () => {
  test('should update state with mutator function', async () => {
    const state = new Understate({ initial: 0 });
    await state.set(val => val + 1);
    const value = await state.get();
    assert.strictEqual(value, 1);
  });

  test('should return Promise resolving to new state', async () => {
    const state = new Understate({ initial: 5 });
    const result = await state.set(val => val * 2);
    assert.strictEqual(result, 10);
  });

  test('should chain multiple set operations', async () => {
    const state = new Understate({ initial: 1 });
    await state.set(val => val + 1);
    await state.set(val => val * 2);
    await state.set(val => val + 3);
    const value = await state.get();
    assert.strictEqual(value, 7); // ((1 + 1) * 2) + 3 = 7
  });

  test('should handle complex state objects', async () => {
    const state = new Understate({ initial: { count: 0, name: 'test' } });
    await state.set(obj => ({ ...obj, count: obj.count + 1 }));
    const value = await state.get();
    assert.deepStrictEqual(value, { count: 1, name: 'test' });
  });

  test('should handle array mutations', async () => {
    const state = new Understate({ initial: [1, 2, 3] });
    await state.set(arr => [...arr, 4]);
    const value = await state.get();
    assert.deepStrictEqual(value, [1, 2, 3, 4]);
  });

  test('should throw TypeError when mutator is null', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.set(null),
      {
        name: 'TypeError',
        message: /mutator parameter is required/
      }
    );
  });

  test('should throw TypeError when mutator is undefined', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.set(undefined),
      {
        name: 'TypeError',
        message: /mutator parameter is required/
      }
    );
  });

  test('should throw TypeError when mutator is not a function', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.set(42),
      {
        name: 'TypeError',
        message: /mutator must be a function/
      }
    );
  });

  test('should throw TypeError for non-object config', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.set(val => val + 1, 'invalid'),
      {
        name: 'TypeError',
        message: /config parameter must be an object/
      }
    );
  });

  test('should handle mutator that throws error', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.set(() => {
        throw new Error('Mutator error');
      }),
      {
        name: 'Error',
        message: /Mutator function threw an error/
      }
    );
  });

  test('should generate new ID after set', async () => {
    const state = new Understate({ initial: 0 });
    const id1 = state._getId();
    await state.set(val => val + 1);
    const id2 = state._getId();
    assert.notStrictEqual(id1, id2);
  });
});

//=============================================================================
// Set with Indexing Tests
//=============================================================================

describe('Understate.set() with indexing', () => {
  test('should index state when index config is true', async () => {
    const state = new Understate({ initial: 0 });
    const result = await state.set(val => val + 1, { index: true });
    const id = state._getId();
    assert.strictEqual(state._indexed.size, 1);
    assert.strictEqual(state._indexed.get(id), 1);
  });

  test('should return state and ID when indexing', async () => {
    const state = new Understate({ initial: 0 });
    await state.set(val => val + 5, { index: true });
    // The promise resolves with the new state as first argument
    const value = await state.get();
    assert.strictEqual(value, 5);
  });

  test('should automatically index when instance has index:true', async () => {
    const state = new Understate({ initial: 0, index: true });
    await state.set(val => val + 1);
    // Should have initial state and updated state indexed
    assert.ok(state._indexed.size >= 1);
  });

  test('should override instance index setting with config', async () => {
    const state = new Understate({ initial: 0, index: true });
    const sizeBefore = state._indexed.size;
    await state.set(val => val + 1, { index: false });
    // Should not add new index entry
    assert.strictEqual(state._indexed.size, sizeBefore);
  });
});

//=============================================================================
// Asynchronous Set Tests
//=============================================================================

describe('Understate.set() asynchronous', () => {
  test('should handle async mutator with asynchronous flag', async () => {
    const state = new Understate({ initial: 0 });
    await state.set(
      async val => {
        return new Promise(resolve => {
          setTimeout(() => resolve(val + 1), 10);
        });
      },
      { asynchronous: true }
    );
    const value = await state.get();
    assert.strictEqual(value, 1);
  });

  test('should handle async mutator with instance asynchronous:true', async () => {
    const state = new Understate({ initial: 5, asynchronous: true });
    await state.set(async val => {
      return new Promise(resolve => {
        setTimeout(() => resolve(val * 2), 10);
      });
    });
    const value = await state.get();
    assert.strictEqual(value, 10);
  });

  test('should reject when async mutator rejects', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.set(
        async () => {
          throw new Error('Async error');
        },
        { asynchronous: true }
      ),
      {
        name: 'Error',
        message: /Asynchronous mutator rejected/
      }
    );
  });

  test('should throw TypeError when asynchronous mode expects Promise', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.set(
        val => val + 1, // Not returning a Promise
        { asynchronous: true }
      ),
      {
        name: 'TypeError',
        message: /mutator must return a Promise/
      }
    );
  });
});

//=============================================================================
// s() Method Tests (Chainable Set)
//=============================================================================

describe('Understate.s()', () => {
  test('should update state and return instance', () => {
    const state = new Understate({ initial: 0 });
    const result = state.s(val => val + 1);
    assert.strictEqual(result, state);
  });

  test('should allow method chaining', async () => {
    const state = new Understate({ initial: 1 });
    state
      .s(val => val + 1)
      .s(val => val * 2)
      .s(val => val + 3);

    // Give time for async operations
    await new Promise(resolve => setTimeout(resolve, 10));
    const value = await state.get();
    assert.strictEqual(value, 7); // ((1 + 1) * 2) + 3 = 7
  });

  test('should throw TypeError when mutator is not a function', () => {
    const state = new Understate({ initial: 0 });
    assert.throws(
      () => state.s(42),
      {
        name: 'TypeError',
        message: /mutator must be a function/
      }
    );
  });

  test('should chain with get', async () => {
    const state = new Understate({ initial: 10 });
    const result = state.s(val => val * 2);
    // Give time for async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    const value = await result.get();
    assert.strictEqual(value, 20);
  });
});

//=============================================================================
// Get Operation Tests
//=============================================================================

describe('Understate.get()', () => {
  test('should retrieve current state', async () => {
    const state = new Understate({ initial: 42 });
    const value = await state.get();
    assert.strictEqual(value, 42);
  });

  test('should retrieve updated state', async () => {
    const state = new Understate({ initial: 0 });
    await state.set(val => val + 5);
    const value = await state.get();
    assert.strictEqual(value, 5);
  });

  test('should return Promise', () => {
    const state = new Understate({ initial: 0 });
    const result = state.get();
    assert.ok(result instanceof Promise);
  });

  test('should retrieve indexed state by ID', async () => {
    const state = new Understate({ initial: 0, index: true });
    await state.set(val => val + 1);
    const id = state._getId();
    await state.set(val => val + 1);

    // Get the indexed state
    const indexedValue = await state.get(id);
    assert.strictEqual(indexedValue, 1);
  });

  test('should reject when retrieving non-existent ID', () => {
    const state = new Understate({ initial: 0, index: true });
    assert.rejects(
      async () => await state.get('nonexistent'),
      {
        name: 'Error',
        message: /No state found for id/
      }
    );
  });

  test('should throw TypeError for empty string ID', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.get(''),
      {
        name: 'TypeError',
        message: /id parameter cannot be an empty string/
      }
    );
  });

  test('should throw TypeError for invalid ID type', () => {
    const state = new Understate({ initial: 0 });
    assert.rejects(
      async () => await state.get(123),
      {
        name: 'TypeError',
        message: /id parameter must be a string or false/
      }
    );
  });

  test('should retrieve object state', async () => {
    const obj = { name: 'test', value: 42 };
    const state = new Understate({ initial: obj });
    const value = await state.get();
    assert.deepStrictEqual(value, obj);
  });
});

//=============================================================================
// Subscribe Tests
//=============================================================================

describe('Understate.subscribe()', () => {
  test('should add subscription callback', () => {
    const state = new Understate({ initial: 0 });
    const callback = () => {};
    state.subscribe(callback);
    assert.strictEqual(state._subscriptions.size, 1);
    assert.ok(state._subscriptions.has(callback));
  });

  test('should call subscription on state update', async () => {
    const state = new Understate({ initial: 0 });
    let called = false;
    let receivedValue = null;

    state.subscribe(newValue => {
      called = true;
      receivedValue = newValue;
    });

    await state.set(val => val + 1);

    assert.strictEqual(called, true);
    assert.strictEqual(receivedValue, 1);
  });

  test('should call multiple subscriptions', async () => {
    const state = new Understate({ initial: 0 });
    let count1 = 0, count2 = 0;

    state.subscribe(() => count1++);
    state.subscribe(() => count2++);

    await state.set(val => val + 1);

    assert.strictEqual(count1, 1);
    assert.strictEqual(count2, 1);
  });

  test('should receive state ID when indexing', async () => {
    const state = new Understate({ initial: 0, index: true });
    let receivedId = null;

    state.subscribe((newValue, stateId) => {
      receivedId = stateId;
    });

    await state.set(val => val + 1);

    assert.strictEqual(typeof receivedId, 'string');
    assert.ok(receivedId.length > 0);
  });

  test('should return subscription pointer', () => {
    const state = new Understate({ initial: 0 });
    const pointer = state.subscribe(() => {});

    assert.ok(pointer);
    assert.strictEqual(typeof pointer.unsubscribe, 'function');
    assert.strictEqual(typeof pointer.set, 'function');
    assert.strictEqual(typeof pointer.get, 'function');
    assert.strictEqual(typeof pointer.subscribe, 'function');
  });

  test('should throw TypeError when subscription is null', () => {
    const state = new Understate({ initial: 0 });
    assert.throws(
      () => state.subscribe(null),
      {
        name: 'TypeError',
        message: /subscription parameter is required/
      }
    );
  });

  test('should throw TypeError when subscription is undefined', () => {
    const state = new Understate({ initial: 0 });
    assert.throws(
      () => state.subscribe(undefined),
      {
        name: 'TypeError',
        message: /subscription parameter is required/
      }
    );
  });

  test('should throw TypeError when subscription is not a function', () => {
    const state = new Understate({ initial: 0 });
    assert.throws(
      () => state.subscribe('not a function'),
      {
        name: 'TypeError',
        message: /subscription must be a function/
      }
    );
  });

  test('should allow nested subscriptions', () => {
    const state = new Understate({ initial: 0 });
    const parent = state.subscribe(() => {});
    const child = parent.subscribe(() => {});

    assert.strictEqual(state._subscriptions.size, 2);
    assert.ok(child.unsubscribe);
  });

  test('should not fail other subscriptions if one throws', async () => {
    const state = new Understate({ initial: 0 });
    let called = false;

    state.subscribe(() => {
      throw new Error('Subscription error');
    });

    state.subscribe(() => {
      called = true;
    });

    await state.set(val => val + 1);

    // Second subscription should still be called
    assert.strictEqual(called, true);
  });
});

//=============================================================================
// Unsubscribe Tests
//=============================================================================

describe('Understate subscription.unsubscribe()', () => {
  test('should remove subscription', async () => {
    const state = new Understate({ initial: 0 });
    let count = 0;

    const pointer = state.subscribe(() => count++);
    await state.set(val => val + 1);
    assert.strictEqual(count, 1);

    pointer.unsubscribe();
    await state.set(val => val + 1);
    assert.strictEqual(count, 1); // Should not increment
  });

  test('should remove subscription from subscriptions set', () => {
    const state = new Understate({ initial: 0 });
    const callback = () => {};
    const pointer = state.subscribe(callback);

    assert.strictEqual(state._subscriptions.size, 1);
    pointer.unsubscribe();
    assert.strictEqual(state._subscriptions.size, 0);
    assert.ok(!state._subscriptions.has(callback));
  });

  test('should return original instance', () => {
    const state = new Understate({ initial: 0 });
    const pointer = state.subscribe(() => {});
    const result = pointer.unsubscribe();

    assert.strictEqual(result, state);
  });

  test('should unsubscribe parent when unsubscribeParents is true', () => {
    const state = new Understate({ initial: 0 });
    const parent = state.subscribe(() => {});
    const child = parent.subscribe(() => {});

    assert.strictEqual(state._subscriptions.size, 2);

    child.unsubscribe(true);

    assert.strictEqual(state._subscriptions.size, 0);
  });

  test('should unsubscribe specific number of parents', () => {
    const state = new Understate({ initial: 0 });
    const sub1 = state.subscribe(() => {});
    const sub2 = sub1.subscribe(() => {});
    const sub3 = sub2.subscribe(() => {});

    assert.strictEqual(state._subscriptions.size, 3);

    // Unsubscribe self and 1 parent (sub2)
    sub3.unsubscribe(1);

    assert.strictEqual(state._subscriptions.size, 1); // Only sub1 remains
  });

  test('should throw TypeError for invalid unsubscribeParents type', () => {
    const state = new Understate({ initial: 0 });
    const pointer = state.subscribe(() => {});

    assert.throws(
      () => pointer.unsubscribe('invalid'),
      {
        name: 'TypeError',
        message: /unsubscribeParents must be a boolean or number/
      }
    );
  });

  test('should throw TypeError for NaN unsubscribeParents', () => {
    const state = new Understate({ initial: 0 });
    const pointer = state.subscribe(() => {});

    assert.throws(
      () => pointer.unsubscribe(NaN),
      {
        name: 'TypeError',
        message: /unsubscribeParents number cannot be NaN/
      }
    );
  });

  test('should throw RangeError for negative unsubscribeParents', () => {
    const state = new Understate({ initial: 0 });
    const pointer = state.subscribe(() => {});

    assert.throws(
      () => pointer.unsubscribe(-1),
      {
        name: 'RangeError',
        message: /unsubscribeParents must be a non-negative number/
      }
    );
  });

  test('should throw TypeError for non-integer unsubscribeParents', () => {
    const state = new Understate({ initial: 0 });
    const pointer = state.subscribe(() => {});

    assert.throws(
      () => pointer.unsubscribe(1.5),
      {
        name: 'TypeError',
        message: /unsubscribeParents must be an integer/
      }
    );
  });

  test('should handle multiple unsubscribe calls safely', () => {
    const state = new Understate({ initial: 0 });
    const pointer = state.subscribe(() => {});

    pointer.unsubscribe();
    assert.strictEqual(state._subscriptions.size, 0);

    // Should not throw on second call
    pointer.unsubscribe();
    assert.strictEqual(state._subscriptions.size, 0);
  });
});

//=============================================================================
// id() Method Tests
//=============================================================================

describe('Understate.id()', () => {
  test('should return current state ID using _getId()', () => {
    const state = new Understate({ initial: 0 });
    const id = state._getId();
    assert.strictEqual(typeof id, 'string');
    assert.ok(id.length > 0);
  });

  test('should return same ID before state update', () => {
    const state = new Understate({ initial: 0 });
    const id1 = state._getId();
    const id2 = state._getId();
    assert.strictEqual(id1, id2);
  });

  test('should return different ID after state update', async () => {
    const state = new Understate({ initial: 0 });
    const id1 = state._getId();
    await state.set(val => val + 1);
    const id2 = state._getId();
    assert.notStrictEqual(id1, id2);
  });

  test('should have indexed Map for state storage', () => {
    const state = new Understate({ initial: 42 });
    assert.ok(state._indexed instanceof Map);
  });

  test('should throw TypeError for non-boolean index parameter when calling id()', () => {
    const state = new Understate({ initial: 0 });
    assert.throws(
      () => state.id('true'),
      {
        name: 'TypeError',
        message: /index parameter must be a boolean/
      }
    );
  });

  test('should access ID through _getId method', () => {
    const state = new Understate({ initial: 100 });
    const id = state._getId();
    assert.strictEqual(typeof id, 'string');
    assert.ok(/^\d+$/.test(id));
  });
});

//=============================================================================
// Integration Tests
//=============================================================================

describe('Integration Tests', () => {
  test('should handle complete workflow with subscriptions', async () => {
    const state = new Understate({ initial: 0, index: true });
    const updates = [];

    state.subscribe((value, id) => {
      updates.push({ value, id });
    });

    await state.set(val => val + 1);
    await state.set(val => val * 2);
    await state.set(val => val + 3);

    assert.strictEqual(updates.length, 3);
    assert.strictEqual(updates[0].value, 1);
    assert.strictEqual(updates[1].value, 2);
    assert.strictEqual(updates[2].value, 5);

    // Verify we can retrieve historical states
    const historical = await state.get(updates[0].id);
    assert.strictEqual(historical, 1);
  });

  test('should handle object state with subscriptions', async () => {
    const state = new Understate({
      initial: { count: 0, items: [] }
    });

    let lastUpdate = null;
    state.subscribe(value => {
      lastUpdate = value;
    });

    await state.set(obj => ({
      ...obj,
      count: obj.count + 1,
      items: [...obj.items, 'item1']
    }));

    assert.deepStrictEqual(lastUpdate, {
      count: 1,
      items: ['item1']
    });

    const current = await state.get();
    assert.deepStrictEqual(current, lastUpdate);
  });

  test('should handle multiple subscribers with unsubscribe', async () => {
    const state = new Understate({ initial: 0 });
    let count1 = 0, count2 = 0, count3 = 0;

    const sub1 = state.subscribe(() => count1++);
    const sub2 = state.subscribe(() => count2++);
    const sub3 = state.subscribe(() => count3++);

    await state.set(val => val + 1);
    assert.strictEqual(count1, 1);
    assert.strictEqual(count2, 1);
    assert.strictEqual(count3, 1);

    sub2.unsubscribe();

    await state.set(val => val + 1);
    assert.strictEqual(count1, 2);
    assert.strictEqual(count2, 1); // Not updated
    assert.strictEqual(count3, 2);
  });

  test('should handle async operations with subscriptions', async () => {
    const state = new Understate({ initial: 0, asynchronous: true });
    let updates = 0;

    state.subscribe(() => updates++);

    await state.set(async val => {
      return new Promise(resolve => {
        setTimeout(() => resolve(val + 1), 5);
      });
    });

    assert.strictEqual(updates, 1);
    const value = await state.get();
    assert.strictEqual(value, 1);
  });

  test('should maintain state consistency across operations', async () => {
    const state = new Understate({ initial: 1 });

    // Perform multiple operations
    await state.set(val => val * 2);
    await state.set(val => val + 3);
    await state.set(val => val * 2);

    const final = await state.get();
    assert.strictEqual(final, 10); // ((1 * 2) + 3) * 2 = 10
  });

  test('should handle chaining with s() and subscriptions', async () => {
    const state = new Understate({ initial: 0 });
    const values = [];

    state.subscribe(val => values.push(val));

    state
      .s(val => val + 1)
      .s(val => val + 2)
      .s(val => val + 3);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.deepStrictEqual(values, [1, 3, 6]);
  });

  test('should support indexing with retrieval', async () => {
    const state = new Understate({ initial: 'start', index: true });
    const ids = [];

    state.subscribe((value, id) => {
      if (id) ids.push(id);
    });

    await state.set(() => 'middle');
    await state.set(() => 'end');

    // Retrieve historical states
    const middleState = await state.get(ids[0]);
    assert.strictEqual(middleState, 'middle');

    const currentState = await state.get();
    assert.strictEqual(currentState, 'end');
  });
});

//=============================================================================
// Edge Cases and Error Handling
//=============================================================================

describe('Edge Cases', () => {
  test('should handle state transition from undefined to defined', async () => {
    const state = new Understate();
    await state.set(() => 42);
    const value = await state.get();
    assert.strictEqual(value, 42);
  });

  test('should handle state transition to null', async () => {
    const state = new Understate({ initial: 42 });
    await state.set(() => null);
    const value = await state.get();
    assert.strictEqual(value, null);
  });

  test('should handle state transition to undefined', async () => {
    const state = new Understate({ initial: 42 });
    await state.set(() => undefined);
    const value = await state.get();
    assert.strictEqual(value, undefined);
  });

  test('should handle empty object state', async () => {
    const state = new Understate({ initial: {} });
    const value = await state.get();
    assert.deepStrictEqual(value, {});
  });

  test('should handle empty array state', async () => {
    const state = new Understate({ initial: [] });
    const value = await state.get();
    assert.deepStrictEqual(value, []);
  });

  test('should handle zero as state', async () => {
    const state = new Understate({ initial: 0 });
    const value = await state.get();
    assert.strictEqual(value, 0);
  });

  test('should handle false as state', async () => {
    const state = new Understate({ initial: false });
    const value = await state.get();
    assert.strictEqual(value, false);
  });

  test('should handle empty string as state', async () => {
    const state = new Understate({ initial: '' });
    const value = await state.get();
    assert.strictEqual(value, '');
  });

  test('should handle rapid consecutive updates', async () => {
    const state = new Understate({ initial: 0 });

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(state.set(val => val + 1));
    }

    await Promise.all(promises);
    const value = await state.get();
    assert.strictEqual(value, 10);
  });

  test('should handle large indexed state history', async () => {
    const state = new Understate({ initial: 0, index: true });

    for (let i = 0; i < 100; i++) {
      await state.set(val => val + 1);
    }

    assert.ok(state._indexed.size > 90); // Should have many indexed states
    const value = await state.get();
    assert.strictEqual(value, 100);
  });
});
