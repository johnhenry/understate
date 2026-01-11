import { describe, it } from 'node:test';
import assert from 'assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Understate = require('../../dist/index.js');

//=============================================================================
// Test Suite: id() Method Edge Cases
//=============================================================================

describe('id() method', function() {
  describe('without indexing parameter', function() {
    it('should return a valid ID string', function() {
      const state = new Understate({ initial: 'test' });
      const id = state.id();

      assert.strictEqual(typeof id, 'string');
      assert.ok(id.length > 0);
    });

    it('should return consistent ID for same state', function() {
      const state = new Understate({ initial: 42 });
      const id1 = state.id();
      const id2 = state.id();

      assert.strictEqual(id1, id2);
    });

    it('should work with undefined initial state', function() {
      const state = new Understate();
      const id = state.id();

      assert.strictEqual(typeof id, 'string');
      assert.ok(id.length > 0);
    });
  });

  describe('with indexing parameter (index=true)', function() {
    it('should index current state and return ID', async function() {
      const state = new Understate({ initial: 'indexed' });
      const id = state.id(true);

      assert.strictEqual(typeof id, 'string');

      // Verify the state was indexed by retrieving it
      const retrievedState = await state.get(id);
      assert.strictEqual(retrievedState, 'indexed');
    });

    it('should allow retrieval of indexed state after multiple updates', async function() {
      const state = new Understate({ initial: 0 });
      const id1 = state.id(true);

      await state.set(_ => 10);
      await state.set(_ => 20);
      const retrievedState = await state.get(id1);
      assert.strictEqual(retrievedState, 0);
    });

    it('should index state with null value', async function() {
      const state = new Understate({ initial: null });
      const id = state.id(true);

      const retrievedState = await state.get(id);
      assert.strictEqual(retrievedState, null);
    });

    it('should index state with object value', async function() {
      const obj = { key: 'value', num: 123 };
      const state = new Understate({ initial: obj });
      const id = state.id(true);

      const retrievedState = await state.get(id);
      assert.deepStrictEqual(retrievedState, obj);
    });
  });

  describe('with invalid indexing parameter', function() {
    it('should handle non-boolean index parameter gracefully', function() {
      const state = new Understate({ initial: 'test' });
      // The dist version doesn't validate this, so it should not throw
      const id = state.id('true');
      assert.strictEqual(typeof id, 'string');
    });
  });
});

//=============================================================================
// Test Suite: get() Method with Indexed State IDs
//=============================================================================

describe('get() with indexed state IDs', function() {
  describe('retrieving indexed states', function() {
    it('should retrieve state by valid ID', async function() {
      const state = new Understate({ initial: 100, index: true });

      const [newState, id] = await state.set(_ => 200, { index: true });
      const retrievedState = await state.get(id);
      assert.strictEqual(retrievedState, 200);
    });

    it('should retrieve multiple different indexed states', async function() {
      const state = new Understate({ initial: 'a', index: true });

      const [state1, id1] = await state.set(_ => 'b', { index: true });
      const [state2, id2] = await state.set(_ => 'c', { index: true });
      const [state3, id3] = await state.set(_ => 'd', { index: true });

      const [retrieved1, retrieved2, retrieved3] = await Promise.all([
        state.get(id1),
        state.get(id2),
        state.get(id3)
      ]);

      assert.strictEqual(retrieved1, 'b');
      assert.strictEqual(retrieved2, 'c');
      assert.strictEqual(retrieved3, 'd');
    });

    it('should retrieve current state when id=false', async function() {
      const state = new Understate({ initial: 'current' });
      const retrievedState = await state.get(false);
      assert.strictEqual(retrievedState, 'current');
    });

    it('should retrieve current state when called without parameters', async function() {
      const state = new Understate({ initial: 'default' });
      const retrievedState = await state.get();
      assert.strictEqual(retrievedState, 'default');
    });
  });

  describe('error handling for invalid IDs', function() {
    it('should return undefined for non-existent ID', async function() {
      const state = new Understate({ initial: 'test', index: true });
      const result = await state.get('nonexistent123');
      assert.strictEqual(result, undefined);
    });

    it('should handle empty string ID', async function() {
      const state = new Understate({ initial: 'test' });
      // The dist version doesn't validate empty strings
      const result = await state.get('');
      assert.strictEqual(result, undefined);
    });

    it('should handle numeric ID by converting to string key', async function() {
      const state = new Understate({ initial: 'test' });
      // JavaScript Map will handle numeric keys
      const result = await state.get(123);
      assert.strictEqual(result, undefined);
    });
  });

  describe('indexed state with null and undefined', function() {
    it('should retrieve indexed null state', async function() {
      const state = new Understate({ initial: null, index: true });
      const id = state.id();

      const retrievedState = await state.get(id);
      assert.strictEqual(retrievedState, null);
    });

    it('should retrieve indexed undefined state', async function() {
      const state = new Understate({ index: true });
      const id = state.id();

      const retrievedState = await state.get(id);
      assert.strictEqual(retrievedState, undefined);
    });
  });
});

//=============================================================================
// Test Suite: Error Handling for Invalid Mutators
//=============================================================================

describe('error handling for invalid mutators', function() {
  describe('set() with invalid mutators', function() {
    it('should throw error when mutator is null', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.set(null),
        Error,
        'Mutator Must be a Function'
      );
    });

    it('should throw error when mutator is undefined', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.set(undefined),
        Error,
        'Mutator Must be a Function'
      );
    });

    it('should throw error when mutator is not a function', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.set('not a function'),
        Error,
        'Mutator Must be a Function'
      );
    });

    it('should throw error when mutator is a number', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.set(42),
        Error,
        'Mutator Must be a Function'
      );
    });

    it('should throw error when mutator is an object', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.set({ value: 10 }),
        Error,
        'Mutator Must be a Function'
      );
    });

    it('should throw error when mutator is an array', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.set([1, 2, 3]),
        Error,
        'Mutator Must be a Function'
      );
    });
  });

  describe('set() with mutators that throw errors', function() {
    it('should reject when mutator throws error', async function() {
      const state = new Understate({ initial: 0 });

      try {
        await state.set(() => {
          throw new Error('Mutator error');
        });
        assert.fail('Should have rejected');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Mutator error'));
      }
    });

    it('should reject when mutator throws TypeError', async function() {
      const state = new Understate({ initial: 0 });

      try {
        await state.set(() => {
          throw new TypeError('Type error in mutator');
        });
        assert.fail('Should have rejected');
      } catch (error) {
        assert.ok(error instanceof TypeError);
        assert.ok(error.message.includes('Type error in mutator'));
      }
    });
  });

  describe('set() with invalid config', function() {
    it('should handle config gracefully even if not an object', function() {
      const state = new Understate({ initial: 0 });
      // The dist version uses Object.assign which will convert primitives
      // It should not throw
      assert.doesNotThrow(() => {
        state.set(_ => 10, 'invalid config');
      });
    });
  });

  describe('s() chainable method with invalid mutators', function() {
    it('should throw error when mutator is null', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.s(null),
        Error,
        'Mutator Must be a Function'
      );
    });

    it('should throw error when mutator is not a function', function() {
      const state = new Understate({ initial: 0 });

      assert.throws(
        () => state.s(123),
        Error,
        'Mutator Must be a Function'
      );
    });
  });

  describe('async mutators with invalid return values', function() {
    it('should reject when async mutator does not return a Promise', async function() {
      const state = new Understate({ initial: 0, asynchronous: true });

      try {
        await state.set(_ => 'not a promise');
        assert.fail('Should have rejected');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });

    it('should reject when async mutator returns non-Promise in async mode', async function() {
      const state = new Understate({ initial: 0 });

      try {
        await state.set(_ => 42, { asynchronous: true });
        assert.fail('Should have rejected');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });

    it('should handle rejected async mutator', async function() {
      const state = new Understate({ initial: 0, asynchronous: true });

      try {
        await state.set(_ => Promise.reject(new Error('Async rejection')));
        assert.fail('Should have rejected');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Async rejection'));
      }
    });
  });
});

//=============================================================================
// Test Suite: unsubscribe() with Parent Propagation
//=============================================================================

describe('unsubscribe with parent propagation', function() {
  describe('basic unsubscribe (unsubscribeParents=false)', function() {
    it('should unsubscribe only the current subscription', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const sub1 = state.subscribe(val => calls.push('sub1:' + val));
      const sub2 = sub1.subscribe(val => calls.push('sub2:' + val));

      sub2.unsubscribe(false);

      await state.set(_ => 10);

      // Only sub1 should have received the update
      assert.deepStrictEqual(calls, ['sub1:10']);
    });

    it('should unsubscribe without affecting other subscriptions', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const sub1 = state.subscribe(val => calls.push('sub1:' + val));
      const sub2 = state.subscribe(val => calls.push('sub2:' + val));
      const sub3 = state.subscribe(val => calls.push('sub3:' + val));

      sub2.unsubscribe();

      await state.set(_ => 5);

      assert.ok(calls.includes('sub1:5'));
      assert.ok(!calls.includes('sub2:5'));
      assert.ok(calls.includes('sub3:5'));
    });
  });

  describe('unsubscribe with parent propagation (unsubscribeParents=true)', function() {
    it('should unsubscribe current and parent subscription', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const parent = state.subscribe(val => calls.push('parent:' + val));
      const child = parent.subscribe(val => calls.push('child:' + val));

      child.unsubscribe(true);

      await state.set(_ => 15);

      // Neither parent nor child should receive updates
      assert.strictEqual(calls.length, 0);
    });

    it('should unsubscribe nested chain with true parameter', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const level1 = state.subscribe(val => calls.push('level1:' + val));
      const level2 = level1.subscribe(val => calls.push('level2:' + val));
      const level3 = level2.subscribe(val => calls.push('level3:' + val));

      level3.unsubscribe(true);

      await state.set(_ => 20);

      // All levels should be unsubscribed
      assert.strictEqual(calls.length, 0);
    });

    it('should handle unsubscribe at root level with true parameter', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const sub = state.subscribe(val => calls.push('sub:' + val));

      // Should not throw when trying to unsubscribe parent at root
      sub.unsubscribe(true);

      await state.set(_ => 25);

      assert.strictEqual(calls.length, 0);
    });
  });

  describe('unsubscribe with numeric levels (unsubscribeParents=number)', function() {
    it('should unsubscribe specific number of parent levels', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const level1 = state.subscribe(val => calls.push('level1:' + val));
      const level2 = level1.subscribe(val => calls.push('level2:' + val));
      const level3 = level2.subscribe(val => calls.push('level3:' + val));
      const level4 = level3.subscribe(val => calls.push('level4:' + val));

      // Unsubscribe level4 and 2 parent levels (level3, level2)
      level4.unsubscribe(2);

      await state.set(_ => 30);

      // Only level1 should remain
      assert.deepStrictEqual(calls, ['level1:30']);
    });

    it('should handle unsubscribe with 0 levels (same as false)', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const parent = state.subscribe(val => calls.push('parent:' + val));
      const child = parent.subscribe(val => calls.push('child:' + val));

      child.unsubscribe(0);

      await state.set(_ => 35);

      // Only parent should remain
      assert.deepStrictEqual(calls, ['parent:35']);
    });

    it('should handle large unsubscribe levels without error', async function() {
      const state = new Understate({ initial: 0 });
      const calls = [];

      const level1 = state.subscribe(val => calls.push('level1:' + val));
      const level2 = level1.subscribe(val => calls.push('level2:' + val));

      // Unsubscribe with more levels than exist
      level2.unsubscribe(10);

      await state.set(_ => 40);

      assert.strictEqual(calls.length, 0);
    });
  });

  describe('unsubscribe parameter validation', function() {
    it('should handle non-boolean/non-number parameter gracefully', function() {
      const state = new Understate({ initial: 0 });
      const sub = state.subscribe(() => {});

      // The dist version doesn't validate parameter types strictly
      assert.doesNotThrow(() => {
        sub.unsubscribe('true');
      });
    });

    it('should handle negative numbers', function() {
      const state = new Understate({ initial: 0 });
      const sub = state.subscribe(() => {});

      // The dist version has a TODO for validation but doesn't enforce it
      assert.doesNotThrow(() => {
        sub.unsubscribe(-1);
      });
    });
  });

  describe('unsubscribe return value', function() {
    it('should return original Understate instance', function() {
      const state = new Understate({ initial: 0 });
      const sub = state.subscribe(() => {});

      const result = sub.unsubscribe();

      // Result should have Understate methods
      assert.strictEqual(typeof result.set, 'function');
      assert.strictEqual(typeof result.get, 'function');
      assert.strictEqual(typeof result.subscribe, 'function');
    });
  });
});

//=============================================================================
// Test Suite: Empty and Null State Handling
//=============================================================================

describe('empty and null state handling', function() {
  describe('undefined/empty state', function() {
    it('should handle undefined initial state', async function() {
      const state = new Understate();
      const result = await state.get();
      assert.strictEqual(result, undefined);
    });

    it('should allow updates from undefined state', async function() {
      const state = new Understate();

      await state.set(_ => 'defined');
      const result = await state.get();
      assert.strictEqual(result, 'defined');
    });

    it('should handle mutator receiving undefined state', async function() {
      const state = new Understate();

      await state.set(currentState => {
        assert.strictEqual(currentState, undefined);
        return 'new value';
      });
    });

    it('should allow setting state back to undefined', async function() {
      const state = new Understate({ initial: 'something' });

      await state.set(_ => undefined);
      const result = await state.get();
      assert.strictEqual(result, undefined);
    });
  });

  describe('null state', function() {
    it('should handle null initial state', async function() {
      const state = new Understate({ initial: null });
      const result = await state.get();
      assert.strictEqual(result, null);
    });

    it('should allow updates from null state', async function() {
      const state = new Understate({ initial: null });

      await state.set(_ => 'not null');
      const result = await state.get();
      assert.strictEqual(result, 'not null');
    });

    it('should handle mutator receiving null state', async function() {
      const state = new Understate({ initial: null });

      await state.set(currentState => {
        assert.strictEqual(currentState, null);
        return 0;
      });
    });

    it('should allow setting state to null', async function() {
      const state = new Understate({ initial: 'something' });

      await state.set(_ => null);
      const result = await state.get();
      assert.strictEqual(result, null);
    });

    it('should handle null state with indexing', async function() {
      const state = new Understate({ initial: null, index: true });
      const id = state.id();

      const result = await state.get(id);
      assert.strictEqual(result, null);
    });
  });

  describe('zero and false values', function() {
    it('should handle zero as initial state', async function() {
      const state = new Understate({ initial: 0 });
      const result = await state.get();
      assert.strictEqual(result, 0);
    });

    it('should handle false as initial state', async function() {
      const state = new Understate({ initial: false });
      const result = await state.get();
      assert.strictEqual(result, false);
    });

    it('should handle empty string as initial state', async function() {
      const state = new Understate({ initial: '' });
      const result = await state.get();
      assert.strictEqual(result, '');
    });

    it('should distinguish between undefined, null, 0, false, and empty string', async function() {
      const state1 = new Understate();
      const state2 = new Understate({ initial: null });
      const state3 = new Understate({ initial: 0 });
      const state4 = new Understate({ initial: false });
      const state5 = new Understate({ initial: '' });

      const [r1, r2, r3, r4, r5] = await Promise.all([
        state1.get(),
        state2.get(),
        state3.get(),
        state4.get(),
        state5.get()
      ]);

      assert.strictEqual(r1, undefined);
      assert.strictEqual(r2, null);
      assert.strictEqual(r3, 0);
      assert.strictEqual(r4, false);
      assert.strictEqual(r5, '');
    });
  });

  describe('subscription with null/undefined states', function() {
    it('should notify subscribers of undefined state', async function() {
      const state = new Understate();
      let received = 'not set';

      state.subscribe(val => {
        received = val;
      });

      await state.set(_ => undefined);
      assert.strictEqual(received, undefined);
    });

    it('should notify subscribers of null state', async function() {
      const state = new Understate({ initial: 0 });
      let received = 'not set';

      state.subscribe(val => {
        received = val;
      });

      await state.set(_ => null);
      assert.strictEqual(received, null);
    });

    it('should notify subscribers of transitions to/from falsy values', async function() {
      const state = new Understate({ initial: 0 });
      const values = [];

      state.subscribe(val => values.push(val));

      await state.set(_ => false);
      await state.set(_ => '');
      await state.set(_ => null);
      await state.set(_ => undefined);

      assert.deepStrictEqual(values, [false, '', null, undefined]);
    });
  });

  describe('edge cases with empty objects and arrays', function() {
    it('should handle empty object as state', async function() {
      const state = new Understate({ initial: {} });
      const result = await state.get();
      assert.deepStrictEqual(result, {});
    });

    it('should handle empty array as state', async function() {
      const state = new Understate({ initial: [] });
      const result = await state.get();
      assert.deepStrictEqual(result, []);
    });

    it('should allow mutating empty array to populated array', async function() {
      const state = new Understate({ initial: [] });

      await state.set(arr => [...arr, 1, 2, 3]);
      const result = await state.get();
      assert.deepStrictEqual(result, [1, 2, 3]);
    });

    it('should allow mutating empty object to populated object', async function() {
      const state = new Understate({ initial: {} });

      await state.set(obj => ({ ...obj, key: 'value' }));
      const result = await state.get();
      assert.deepStrictEqual(result, { key: 'value' });
    });
  });
});
