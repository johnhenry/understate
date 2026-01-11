/**
 * @module understate
 * @description A lightweight state management library for tracking and subscribing to state changes.
 * Supports synchronous and asynchronous state updates, optional state indexing, and subscription management.
 */

//=============================================================================
// Utility Functions
//=============================================================================

/**
 * Generates a unique identifier for state snapshots.
 * Creates a pseudo-random ID by converting a random number to a string.
 *
 * @function generateId
 * @returns {string} A 15-character unique identifier string
 * @private
 * @example
 * const stateId = generateId(); // "384756201938475"
 */
export const generateId = function() {
    return String(Math.random()).substr(2, 15);
};

//=============================================================================
// Type Definitions
//=============================================================================

/**
 * Configuration options for creating an Understate instance.
 *
 * @typedef {Object} UnderstateConfig
 * @property {*} [initial=undefined] - The initial state value of the instance
 * @property {boolean} [index=false] - If true, states will be automatically indexed upon update
 * @property {boolean} [asynchronous=false] - If true, state updates will be handled asynchronously
 */

/**
 * Configuration options for state update operations.
 *
 * @typedef {Object} SetConfig
 * @property {boolean} [index] - Override instance-level index setting for this update
 * @property {boolean} [asynchronous] - Override instance-level asynchronous setting for this update
 * @property {*} [initial] - Reserved for future use
 */

/**
 * State mutation function that transforms the current state.
 *
 * @typedef {Function} MutatorFunction
 * @param {*} currentState - The current state value
 * @returns {*|Promise<*>} The new state value, or a Promise resolving to the new state
 */

/**
 * Subscription callback function invoked after state updates.
 *
 * @typedef {Function} SubscriptionCallback
 * @param {*} newState - The updated state value
 * @param {string} [stateId] - The ID of the new state (if indexing is enabled)
 */

/**
 * Object returned from subscription with unsubscribe capability.
 *
 * @typedef {Object} SubscriptionPointer
 * @property {Function} unsubscribe - Method to cancel the subscription
 * @property {Function} set - Inherited set method from Understate instance
 * @property {Function} get - Inherited get method from Understate instance
 * @property {Function} subscribe - Inherited subscribe method from Understate instance
 */

//=============================================================================
// Core Constructor
//=============================================================================

/**
 * Creates a new Understate state management instance.
 *
 * Understate provides a simple but powerful way to manage state with support for:
 * - Synchronous and asynchronous state updates
 * - State indexing and historical state retrieval
 * - Subscription-based reactivity
 * - Method chaining for fluent APIs
 *
 * @class Understate
 * @param {UnderstateConfig} [config={}] - Configuration options for the instance
 * @returns {Understate} A new Understate instance
 *
 * @example
 * // Create a simple state manager
 * const counter = new Understate({ initial: 0 });
 *
 * @example
 * // Create with indexing enabled
 * const history = new Understate({
 *   initial: { value: 0 },
 *   index: true
 * });
 *
 * @example
 * // Create with asynchronous updates
 * const asyncState = new Understate({
 *   initial: null,
 *   asynchronous: true
 * });
 */
export const Understate = function({
    initial = undefined,
    index = false,
    asynchronous = false
} = {}) {
    /** @private @type {*} */
    let _state = initial;

    /** @private @type {string} */
    let _id;

    /** @private */
    this._getState = () => _state;

    /** @private */
    this._setState = _ => _state = _;

    /** @private */
    this._getId = () => _id;

    /** @private */
    this._setId = _ => _id = _;

    this._setId(generateId(this._getState()));

    /** @private @type {boolean} */
    this._index = !!index;

    /** @private @type {boolean} */
    this._asynchronous = !!asynchronous;

    /** @private @type {Set<SubscriptionCallback>} */
    this._subscriptions = new Set();

    /** @private @type {Map<string, *>} */
    this._indexed = new Map();

    if (this._index) {
        this._indexed.set(this._getId(), this._getState());
    }

    return this;
};

//=============================================================================
// State Management Methods
//=============================================================================

/**
 * Updates the current state by applying a mutator function.
 *
 * This is the primary method for modifying state. It applies the mutator function
 * to the current state, updates internal state, notifies subscribers, and optionally
 * indexes the new state.
 *
 * @memberof Understate
 * @method set
 * @param {MutatorFunction} mutator - Function to transform the current state
 * @param {SetConfig} [config={}] - Configuration options for this update
 * @returns {Promise<*>} Promise resolving to the new state (and state ID if indexing is enabled)
 * @throws {Error} If mutator is not a function
 *
 * @example
 * // Synchronous update
 * state.set(currentValue => currentValue + 1)
 *   .then(newValue => console.log(newValue));
 *
 * @example
 * // Asynchronous update
 * state.set(async currentValue => {
 *   const data = await fetchData();
 *   return data;
 * }, { asynchronous: true });
 *
 * @example
 * // Update with indexing
 * state.set(val => val * 2, { index: true })
 *   .then((newValue, stateId) => console.log(stateId));
 */
Understate.prototype.set = function(mutator, config = {}) {
    if (typeof mutator !== 'function') {
        throw new Error('Mutator Must be a Function.');
    }

    config = Object.assign({ initial: undefined, asynchronous: undefined }, config);
    var index = config.index;
    var asynchronous = config.asynchronous;

    var self = this;
    var newState = [mutator(self._getState())];
    asynchronous = asynchronous || (asynchronous !== false && self._asynchronous);
    index = index || (index !== false && self._index);

    return new Promise((resolve, reject) => {
        if (asynchronous) {
            return newState[0].then(newState => {
                newState = [newState];
                this._setState(newState[0]);
                this._setId(generateId(self._getState()));
                if (index) {
                    self._indexed.set(self._getId(), self._getState());
                    newState.push(self._getId());
                }
                self._subscriptions.forEach(sub => sub.apply(self, newState));
                return resolve.apply(self, newState);
            }).catch(reject);
        } else {
            this._setState(newState[0]);
            this._setId(generateId(self._getState()));
            if (index) {
                self._indexed.set(self._getId(), self._getState());
                newState.push(self._getId());
            }
            self._subscriptions.forEach(sub => sub.apply(self, newState));
            return resolve.apply(self, newState);
        }
    });
};

/**
 * Updates the current state and returns the Understate instance for method chaining.
 *
 * This is a convenience method that combines `set()` with fluent interface support.
 * Useful for chaining multiple operations together.
 *
 * @memberof Understate
 * @method s
 * @param {MutatorFunction} mutator - Function to transform the current state
 * @param {SetConfig} [config={}] - Configuration options for this update
 * @returns {Understate} The Understate instance for method chaining
 *
 * @example
 * // Chain multiple updates
 * state.s(val => val + 1)
 *      .s(val => val * 2)
 *      .get().then(result => console.log(result));
 */
Understate.prototype.s = function(mutator, config = {}) {
    this.set(mutator, config);
    return this;
};

/**
 * Retrieves the current state or a previously indexed state by ID.
 *
 * When called without arguments, returns the current state and its ID.
 * When called with a state ID, returns the indexed state for that ID.
 *
 * @memberof Understate
 * @method get
 * @param {string|boolean} [id=false] - The ID of a previously indexed state, or false for current state
 * @returns {Promise<*>} Promise resolving to the requested state value
 *
 * @example
 * // Get current state
 * state.get().then(currentValue => console.log(currentValue));
 *
 * @example
 * // Get indexed state by ID
 * state.get('384756201938475')
 *   .then(historicalValue => console.log(historicalValue));
 */
Understate.prototype.get = function(id = false) {
    return new Promise(resolve => {
        if (id === false) {
            return resolve(this._getState(), this._getId());
        }
        resolve(this._indexed.get(id));
    });
};

//=============================================================================
// Subscription Management Methods
//=============================================================================

/**
 * Subscribes to state updates with a callback function.
 *
 * The subscription callback will be invoked whenever the state is updated via `set()`.
 * Returns a subscription pointer object with an `unsubscribe()` method to cancel
 * the subscription.
 *
 * @memberof Understate
 * @method subscribe
 * @param {SubscriptionCallback} subscription - Callback invoked after each state update
 * @returns {SubscriptionPointer} Object with unsubscribe method and inherited Understate methods
 * @throws {Error} If subscription is not a function
 *
 * @example
 * // Simple subscription
 * const sub = state.subscribe(newValue => {
 *   console.log('State changed to:', newValue);
 * });
 *
 * // Later: unsubscribe
 * sub.unsubscribe();
 *
 * @example
 * // Subscription with indexing
 * const sub = state.subscribe((newValue, stateId) => {
 *   console.log('State:', newValue, 'ID:', stateId);
 * });
 *
 * @example
 * // Nested subscriptions with parent unsubscribe
 * const parent = state.subscribe(val => console.log('parent', val));
 * const child = parent.subscribe(val => console.log('child', val));
 * child.unsubscribe(true); // Unsubscribes both child and parent
 */
Understate.prototype.subscribe = function(subscription) {
    if (typeof subscription !== 'function') {
        throw new Error('Subscription Must be a Function.');
    }

    var original = this;
    original._subscriptions.add(subscription);

    var pointer = Object.create(original);

    /**
     * Unsubscribes the callback from state updates.
     *
     * @param {boolean|number} [unsubscribeParents=false] - If true, unsubscribes parent subscriptions too
     * @returns {Understate} The original Understate instance
     */
    pointer.unsubscribe = (unsubscribeParents = false) => {
        original._subscriptions.delete(subscription);
        if (unsubscribeParents) {
            if (typeof original.unsubscribe === 'function') {
                if (typeof unsubscribeParents === 'number') {
                    // TODO: Also check to ensure that unsubscribeParents is a positive integer
                    return original.unsubscribe(unsubscribeParents - 1);
                }
                return original.unsubscribe(unsubscribeParents);
            }
        }
        return original;
    };

    return pointer;
};

//=============================================================================
// Utility Methods
//=============================================================================

/**
 * Returns the current state ID and optionally indexes the current state.
 *
 * Each state update generates a new unique ID. This method retrieves that ID
 * and can optionally save the current state to the index for later retrieval.
 *
 * @memberof Understate
 * @method id
 * @param {boolean} [index=false] - If true, indexes the current state with its ID
 * @returns {string} The unique identifier of the current state
 *
 * @example
 * // Get current state ID
 * const currentId = state.id();
 *
 * @example
 * // Get ID and index current state
 * const currentId = state.id(true);
 * // Later retrieve this state
 * state.get(currentId).then(historicalState => console.log(historicalState));
 */
Understate.prototype.id = function(index = false) {
    if (index) {
        this._indexed.set(this._id, this._state);
    }
    return this._id;
};

//=============================================================================
// Exports
//=============================================================================

/**
 * Default export for backward compatibility.
 * Prefer using the named export `Understate` in new code.
 *
 * @type {Understate}
 */
export default Understate;
