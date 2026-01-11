//Minimal localStorage Shim
const m = new Map();

/**
 * A minimal localStorage shim using a Map for storage
 * @typedef {Object} Storage
 * @property {function(string): *} getItem - Retrieves an item from storage
 * @property {function(string, *): Map} setItem - Stores an item in storage
 */

/**
 * Storage object that implements a minimal localStorage interface
 * @type {Storage}
 */
const storage = Object.create(null);

/**
 * Retrieves an item from storage
 * @param {string} k - The key to retrieve
 * @returns {*} The stored value or undefined if not found
 */
storage.getItem = k=>m.get(k);

/**
 * Stores an item in storage
 * @param {string} k - The key to store the value under
 * @param {*} v - The value to store
 * @returns {Map} The underlying Map object
 */
storage.setItem = (k,v)=>m.set(k,v);

export { storage };
