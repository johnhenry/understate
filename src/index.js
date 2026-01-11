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
 * @throws {Error} If random number generation fails
 * @private
 * @example
 * const stateId = generateId(); // "384756201938475"
 */
export const generateId = function() {
    try {
        const randomValue = Math.random();
        if (typeof randomValue !== 'number' || isNaN(randomValue) || randomValue < 0 || randomValue >= 1) {
            throw new Error('generateId(): Failed to generate valid random number');
        }
        const idString = String(randomValue).substr(2, 15);
        if (!idString || idString.length === 0) {
            throw new Error('generateId(): Generated ID string is empty');
        }
        return idString;
    } catch (error) {
        throw new Error(`generateId(): Error generating ID - ${error.message}`);
    }
};

/**
 * Validates email format using a regex pattern.
 * Checks if the provided string matches the standard email format.
 *
 * @function validateEmail
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email format is valid, false otherwise
 * @throws {TypeError} If email parameter is not a string
 * @throws {TypeError} If email parameter is null or undefined
 * @public
 * @example
 * validateEmail('user@example.com'); // true
 * validateEmail('invalid.email'); // false
 * validateEmail('test@domain.co.uk'); // true
 */
export const validateEmail = function(email) {
    // Validate input parameter
    if (email === null || email === undefined) {
        throw new TypeError('validateEmail(): email parameter is required, received ' + email);
    }
    if (typeof email !== 'string') {
        throw new TypeError('validateEmail(): email parameter must be a string, received ' + typeof email);
    }

    try {
        // RFC 5322 compliant email regex pattern
        // Matches most common email formats while being reasonably strict
        // Disallows consecutive dots, leading/trailing dots, and invalid characters
        const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        return emailRegex.test(email);
    } catch (error) {
        throw new Error(`validateEmail(): Error validating email - ${error.message}`);
    }
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
 * @throws {TypeError} If config parameter is not an object or null
 * @throws {TypeError} If index parameter is not a boolean when provided
 * @throws {TypeError} If asynchronous parameter is not a boolean when provided
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
    // Validate constructor parameters
    if (arguments.length > 0 && arguments[0] !== undefined && arguments[0] !== null) {
        if (typeof arguments[0] !== 'object' || Array.isArray(arguments[0])) {
            throw new TypeError('Understate(): config parameter must be an object, received ' + typeof arguments[0]);
        }
    }

    if (arguments.length > 0 && arguments[0] && arguments[0].hasOwnProperty('index')) {
        if (typeof index !== 'boolean') {
            throw new TypeError('Understate(): index parameter must be a boolean, received ' + typeof index);
        }
    }

    if (arguments.length > 0 && arguments[0] && arguments[0].hasOwnProperty('asynchronous')) {
        if (typeof asynchronous !== 'boolean') {
            throw new TypeError('Understate(): asynchronous parameter must be a boolean, received ' + typeof asynchronous);
        }
    }

    try {
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
    } catch (error) {
        throw new Error(`Understate(): Failed to initialize instance - ${error.message}`);
    }
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
 * @throws {TypeError} If mutator is not a function
 * @throws {TypeError} If config is not an object when provided
 * @throws {TypeError} If config.index is not a boolean when provided
 * @throws {TypeError} If config.asynchronous is not a boolean when provided
 * @throws {Error} If mutator throws an error
 * @throws {Error} If state update fails
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
    // Validate mutator parameter
    if (mutator === null || mutator === undefined) {
        throw new TypeError('set(): mutator parameter is required, received ' + mutator);
    }
    if (typeof mutator !== 'function') {
        throw new TypeError('set(): mutator must be a function, received ' + typeof mutator);
    }

    // Validate config parameter
    if (config !== null && config !== undefined) {
        if (typeof config !== 'object' || Array.isArray(config)) {
            throw new TypeError('set(): config parameter must be an object, received ' + typeof config);
        }
    }

    try {
        config = Object.assign({ initial: undefined, asynchronous: undefined }, config);
    } catch (error) {
        throw new Error(`set(): Failed to process config parameter - ${error.message}`);
    }

    var index = config.index;
    var asynchronous = config.asynchronous;

    // Validate index if provided
    if (config.hasOwnProperty('index') && index !== null && index !== undefined && typeof index !== 'boolean') {
        throw new TypeError('set(): config.index must be a boolean when provided, received ' + typeof index);
    }

    // Validate asynchronous if provided
    if (config.hasOwnProperty('asynchronous') && asynchronous !== null && asynchronous !== undefined && typeof asynchronous !== 'boolean') {
        throw new TypeError('set(): config.asynchronous must be a boolean when provided, received ' + typeof asynchronous);
    }

    var self = this;

    // Validate state before calling mutator
    var currentState;
    try {
        currentState = self._getState();
    } catch (error) {
        throw new Error(`set(): Failed to get current state - ${error.message}`);
    }

    var newState;
    try {
        newState = [mutator(currentState)];
    } catch (error) {
        throw new Error(`set(): Mutator function threw an error - ${error.message}`);
    }

    asynchronous = asynchronous || (asynchronous !== false && self._asynchronous);
    index = index || (index !== false && self._index);

    return new Promise((resolve, reject) => {
        try {
            if (asynchronous) {
                // Validate that newState[0] is a Promise
                if (!newState[0] || typeof newState[0].then !== 'function') {
                    return reject(new TypeError('set(): In asynchronous mode, mutator must return a Promise, received ' + typeof newState[0]));
                }
                return newState[0].then(newState => {
                    try {
                        newState = [newState];
                        this._setState(newState[0]);
                        this._setId(generateId(self._getState()));
                        if (index) {
                            self._indexed.set(self._getId(), self._getState());
                            newState.push(self._getId());
                        }
                        self._subscriptions.forEach(sub => {
                            try {
                                sub.apply(self, newState);
                            } catch (error) {
                                // Log but don't fail if a subscription throws
                                console.error(`set(): Subscription callback error - ${error.message}`);
                            }
                        });
                        return resolve.apply(self, newState);
                    } catch (error) {
                        return reject(new Error(`set(): Failed to update state asynchronously - ${error.message}`));
                    }
                }).catch(error => {
                    reject(new Error(`set(): Asynchronous mutator rejected - ${error.message || error}`));
                });
            } else {
                this._setState(newState[0]);
                this._setId(generateId(self._getState()));
                if (index) {
                    self._indexed.set(self._getId(), self._getState());
                    newState.push(self._getId());
                }
                self._subscriptions.forEach(sub => {
                    try {
                        sub.apply(self, newState);
                    } catch (error) {
                        // Log but don't fail if a subscription throws
                        console.error(`set(): Subscription callback error - ${error.message}`);
                    }
                });
                return resolve.apply(self, newState);
            }
        } catch (error) {
            reject(new Error(`set(): Unexpected error during state update - ${error.message}`));
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
 * @throws {TypeError} If mutator is not a function
 * @throws {TypeError} If config is not an object when provided
 * @throws {Error} If set() throws an error
 *
 * @example
 * // Chain multiple updates
 * state.s(val => val + 1)
 *      .s(val => val * 2)
 *      .get().then(result => console.log(result));
 */
Understate.prototype.s = function(mutator, config = {}) {
    // Validate mutator parameter
    if (mutator === null || mutator === undefined) {
        throw new TypeError('s(): mutator parameter is required, received ' + mutator);
    }
    if (typeof mutator !== 'function') {
        throw new TypeError('s(): mutator must be a function, received ' + typeof mutator);
    }

    // Validate config parameter
    if (config !== null && config !== undefined) {
        if (typeof config !== 'object' || Array.isArray(config)) {
            throw new TypeError('s(): config parameter must be an object, received ' + typeof config);
        }
    }

    try {
        this.set(mutator, config);
    } catch (error) {
        throw new Error(`s(): Failed to update state - ${error.message}`);
    }

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
 * @throws {TypeError} If id is provided but is not a string or boolean
 * @throws {Error} If state retrieval fails
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
    // Validate id parameter
    if (id !== false && id !== null && id !== undefined) {
        if (typeof id !== 'string' && typeof id !== 'boolean') {
            throw new TypeError('get(): id parameter must be a string or false, received ' + typeof id);
        }
        if (typeof id === 'string' && id.length === 0) {
            throw new TypeError('get(): id parameter cannot be an empty string');
        }
    }

    return new Promise((resolve, reject) => {
        try {
            if (id === false) {
                const state = this._getState();
                const currentId = this._getId();
                return resolve(state, currentId);
            }

            if (!this._indexed || typeof this._indexed.get !== 'function') {
                return reject(new Error('get(): Indexed storage is not available. Ensure indexing is enabled.'));
            }

            const state = this._indexed.get(id);
            if (state === undefined) {
                return reject(new Error(`get(): No state found for id "${id}"`));
            }
            resolve(state);
        } catch (error) {
            reject(new Error(`get(): Failed to retrieve state - ${error.message}`));
        }
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
 * @throws {TypeError} If subscription is not a function
 * @throws {TypeError} If subscription is null or undefined
 * @throws {Error} If subscription setup fails
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
    // Validate subscription parameter
    if (subscription === null || subscription === undefined) {
        throw new TypeError('subscribe(): subscription parameter is required, received ' + subscription);
    }
    if (typeof subscription !== 'function') {
        throw new TypeError('subscribe(): subscription must be a function, received ' + typeof subscription);
    }

    try {
        var original = this;

        if (!original._subscriptions || typeof original._subscriptions.add !== 'function') {
            throw new Error('subscribe(): Subscriptions set is not properly initialized');
        }

        original._subscriptions.add(subscription);
        var pointer = Object.create(original);

        /**
         * Unsubscribes the callback from state updates.
         *
         * @param {boolean|number} [unsubscribeParents=false] - If true, unsubscribes parent subscriptions too
         * @returns {Understate} The original Understate instance
         * @throws {TypeError} If unsubscribeParents is not a boolean or number when provided
         * @throws {RangeError} If unsubscribeParents is a negative number
         */
        pointer.unsubscribe = (unsubscribeParents = false) => {
            // Validate unsubscribeParents parameter
            if (unsubscribeParents !== false && unsubscribeParents !== null && unsubscribeParents !== undefined) {
                if (typeof unsubscribeParents !== 'boolean' && typeof unsubscribeParents !== 'number') {
                    throw new TypeError('unsubscribe(): unsubscribeParents must be a boolean or number, received ' + typeof unsubscribeParents);
                }
                if (typeof unsubscribeParents === 'number') {
                    if (isNaN(unsubscribeParents)) {
                        throw new TypeError('unsubscribe(): unsubscribeParents number cannot be NaN');
                    }
                    if (unsubscribeParents < 0) {
                        throw new RangeError('unsubscribe(): unsubscribeParents must be a non-negative number, received ' + unsubscribeParents);
                    }
                    if (!Number.isInteger(unsubscribeParents)) {
                        throw new TypeError('unsubscribe(): unsubscribeParents must be an integer when provided as a number, received ' + unsubscribeParents);
                    }
                }
            }

            try {
                if (!original._subscriptions || typeof original._subscriptions.delete !== 'function') {
                    throw new Error('unsubscribe(): Subscriptions set is not properly initialized');
                }

                original._subscriptions.delete(subscription);

                if (unsubscribeParents) {
                    if (typeof original.unsubscribe === 'function') {
                        if (typeof unsubscribeParents === 'number') {
                            return original.unsubscribe(unsubscribeParents - 1);
                        }
                        return original.unsubscribe(unsubscribeParents);
                    }
                }
                return original;
            } catch (error) {
                throw new Error(`unsubscribe(): Failed to unsubscribe - ${error.message}`);
            }
        };
        return pointer;
    } catch (error) {
        throw new Error(`subscribe(): Failed to create subscription - ${error.message}`);
    }
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
 * @throws {TypeError} If index parameter is not a boolean when provided
 * @throws {Error} If id retrieval fails
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
    // Validate index parameter
    if (index !== null && index !== undefined && typeof index !== 'boolean') {
        throw new TypeError('id(): index parameter must be a boolean, received ' + typeof index);
    }

    try {
        if (!this._id) {
            throw new Error('id(): Instance ID is not initialized');
        }

        if (index) {
            if (!this._indexed || typeof this._indexed.set !== 'function') {
                throw new Error('id(): Indexed storage is not available');
            }
            if (!this._state && this._getState) {
                const currentState = this._getState();
                this._indexed.set(this._id, currentState);
            } else {
                this._indexed.set(this._id, this._state);
            }
        }
        return this._id;
    } catch (error) {
        throw new Error(`id(): Failed to retrieve or index id - ${error.message}`);
    }
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
