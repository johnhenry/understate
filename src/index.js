//Library=======================================================================
/**
 * Generates a unique identifier string based on a random number.
 *
 * @description Creates a random ID by generating a random number, converting it to a string,
 * and extracting a 15-character substring. This is used internally to track state versions.
 * Note: This should probably be replaced with a proper hash function for production use.
 *
 * @returns {string} A 15-character random ID string
 *
 * @example
 * const uniqueId = id();
 * // Returns something like: "234567890123456"
 */
const id = function(){
    return String(Math.random()).substr(2, 15);
};

/**
 * Creates a new Understate state management instance.
 *
 * @description Understate is a state management library that provides observable state with
 * optional indexing and asynchronous update support. It allows you to manage application state,
 * subscribe to changes, and optionally maintain a history of state versions.
 *
 * @constructor
 * @param {Object} [config={}] - Configuration object for the Understate instance
 * @param {*} [config.initial=undefined] - The initial state value for the instance
 * @param {boolean} [config.index=false] - If true, states will be automatically indexed upon update,
 *                                          allowing retrieval of previous states by ID
 * @param {boolean} [config.asynchronous=false] - If true, state updates will be treated as
 *                                                 asynchronous operations by default
 *
 * @returns {Understate} A new Understate instance
 *
 * @example
 * // Create a simple state instance
 * const state = new Understate({ initial: { count: 0 } });
 *
 * @example
 * // Create an indexed state instance
 * const indexedState = new Understate({
 *   initial: { count: 0 },
 *   index: true
 * });
 *
 * @example
 * // Create an asynchronous state instance
 * const asyncState = new Understate({
 *   initial: { data: null },
 *   asynchronous: true
 * });
 */
var Understate = function({
  initial=undefined,
  index=false,
  asynchronous=false}={}){
    let _state = initial, _id;

    /**
     * Internal getter for the current state.
     *
     * @description Returns the current state value stored in the closure.
     * @private
     * @returns {*} The current state
     */
    this._getState = () => _state;

    /**
     * Internal setter for the current state.
     *
     * @description Updates the state value in the closure.
     * @private
     * @param {*} _ - The new state value
     * @returns {void}
     */
    this._setState = _ => _state = _;

    /**
     * Internal getter for the current state ID.
     *
     * @description Returns the current state ID from the closure.
     * @private
     * @returns {string} The current state ID
     */
    this._getId = ()=>_id;

    /**
     * Internal setter for the current state ID.
     *
     * @description Updates the state ID in the closure.
     * @private
     * @param {string} _ - The new state ID
     * @returns {void}
     */
    this._setId = _=>_id = _;

    this._setId(id(this._getState()));
    this._index = !!index;
    this._asynchronous = !!asynchronous;
    this._subscriptions = new Set();
    this._indexed = new Map();
    if(this._index) this._indexed.set(this._getId(),this._getState());
    return this;
};

/**
 * Updates the current state of the Understate instance.
 *
 * @description Applies a mutator function to transform the current state. The mutator receives
 * the current state and should return the new state. Supports both synchronous and asynchronous
 * mutations. After the state is updated, all subscribed callbacks are notified.
 *
 * @param {Function} mutator - Function that receives the current state and returns the new state.
 *                             For asynchronous updates, can return a Promise.
 * @param {Object} [config={}] - Configuration object for this specific update
 * @param {*} [config.initial=undefined] - Reserved for future use
 * @param {boolean} [config.index] - If true, the updated state will be indexed by its ID.
 *                                   Defaults to the instance's index setting.
 * @param {boolean} [config.asynchronous] - If true, treats the update as asynchronous.
 *                                          Defaults to the instance's asynchronous setting.
 *
 * @returns {Promise<*>} A promise that resolves with the new state value. If indexing is enabled,
 *                       the promise resolves with both the state and its ID.
 *
 * @throws {Error} Throws an error if the mutator parameter is not a function
 *
 * @example
 * // Synchronous state update
 * const state = new Understate({ initial: { count: 0 } });
 * state.set(currentState => ({ count: currentState.count + 1 }))
 *   .then(newState => console.log(newState)); // { count: 1 }
 *
 * @example
 * // Asynchronous state update
 * const asyncState = new Understate({ initial: { data: null }, asynchronous: true });
 * asyncState.set(async currentState => {
 *   const response = await fetch('/api/data');
 *   return await response.json();
 * }).then(newState => console.log(newState));
 *
 * @example
 * // Update with indexing enabled
 * state.set(s => ({ count: s.count + 1 }), { index: true })
 *   .then((newState, stateId) => console.log(newState, stateId));
 */
Understate.prototype.set =
function(mutator, config={}){
    if(typeof mutator !== 'function') throw new Error('Mutator Must be a Function.');
    config = Object.assign({initial:undefined, asynchronous:undefined}, config);
    var index = config.index;
    var asynchronous = config.asynchronous;

    var self = this;
    var newState = [mutator(self._getState())];
    asynchronous = asynchronous || (asynchronous !== false && self._asynchronous);
    index  = index || (index !== false && self._index);
    return new Promise((resolve, reject)=>{
        if(asynchronous){
            return newState[0].then(newState=>{
                newState = [newState];
                this._setState(newState[0]);
                this._setId(id(self._getState()));
                if(index){
                    self._indexed.set(self._getId(), self._getState());
                    newState.push(self._getId());
                }
                self._subscriptions.forEach(sub=>sub.apply(self, newState));
                return resolve.apply(self, newState);
            }).catch(reject);
        }else{
            this._setState(newState[0]);
            this._setId(id(self._getState()));
            if(index){
                self._indexed.set(self._getId(), self._getState());
                newState.push(self._getId());
            }
            self._subscriptions.forEach(sub=>sub.apply(self, newState));
            return resolve.apply(self, newState);
        }
    });
};

/**
 * Updates the current state and returns the Understate instance for method chaining.
 *
 * @description This is a convenience method that wraps the `set` method but returns the
 * Understate instance instead of a Promise. Useful for chaining multiple operations.
 * The 's' stands for "set and return self".
 *
 * @param {Function} mutator - Function that receives the current state and returns the new state
 * @param {Object} [config={}] - Configuration object for this specific update (same as set method)
 * @param {boolean} [config.index] - If true, the updated state will be indexed by its ID
 * @param {boolean} [config.asynchronous] - If true, treats the update as asynchronous
 *
 * @returns {Understate} The Understate instance for chaining
 *
 * @throws {Error} Throws an error if the mutator parameter is not a function
 *
 * @example
 * // Chain multiple state updates
 * const state = new Understate({ initial: { count: 0, name: 'test' } });
 * state
 *   .s(s => ({ ...s, count: s.count + 1 }))
 *   .s(s => ({ ...s, name: 'updated' }))
 *   .get()
 *   .then(finalState => console.log(finalState)); // { count: 1, name: 'updated' }
 *
 * @example
 * // Chain with subscription
 * state
 *   .s(s => ({ count: s.count + 1 }))
 *   .subscribe(newState => console.log('State changed:', newState));
 */
Understate.prototype.s = function(mutator, config={}){
    this.set(mutator, config);
    return this;
};

/**
 * Retrieves the current state or a previously indexed state by ID.
 *
 * @description Returns the current state of the instance. If an ID is provided and indexing
 * is enabled, retrieves the state associated with that ID from the index. Always returns
 * a Promise for consistency.
 *
 * @param {string|boolean} [id=false] - The ID of a previously indexed state to retrieve.
 *                                      If false or omitted, returns the current state.
 *
 * @returns {Promise<*>} A promise that resolves with the requested state. When retrieving
 *                       the current state (no id parameter), the promise resolves with
 *                       both the state and its current ID.
 *
 * @example
 * // Get current state
 * const state = new Understate({ initial: { count: 0 } });
 * state.get().then(currentState => {
 *   console.log(currentState); // { count: 0 }
 * });
 *
 * @example
 * // Get indexed state by ID
 * const indexedState = new Understate({ initial: { count: 0 }, index: true });
 * indexedState.set(s => ({ count: 1 }))
 *   .then((newState, stateId) => {
 *     // Later, retrieve this specific state version
 *     return indexedState.get(stateId);
 *   })
 *   .then(previousState => console.log(previousState)); // { count: 1 }
 *
 * @example
 * // Get current state with ID
 * state.get().then((currentState, currentId) => {
 *   console.log('State:', currentState, 'ID:', currentId);
 * });
 */
Understate.prototype.get =
function(id = false){
    return new Promise(resolve => {
        if(id === false) return resolve(this._getState(), this._getId());
        resolve(this._indexed.get(id));
    });
};

/**
 * Subscribes to state updates with a callback function.
 *
 * @description Registers a callback that will be invoked every time the state is updated.
 * Returns a special proxy object that includes an `unsubscribe` method to cancel the
 * subscription. The callback receives the new state (and optionally the state ID if
 * indexing is enabled).
 *
 * @param {Function} subscription - Callback function to be invoked after each state update.
 *                                  Receives the new state as the first argument, and the
 *                                  state ID as the second argument if indexing is enabled.
 *
 * @returns {Object} A proxy object with all Understate methods plus an `unsubscribe` method.
 *                   The proxy allows you to chain additional operations while maintaining
 *                   the ability to unsubscribe later.
 *
 * @throws {Error} Throws an error if the subscription parameter is not a function
 *
 * @example
 * // Basic subscription
 * const state = new Understate({ initial: { count: 0 } });
 * const subscription = state.subscribe(newState => {
 *   console.log('State updated:', newState);
 * });
 * state.set(s => ({ count: s.count + 1 })); // Logs: "State updated: { count: 1 }"
 * subscription.unsubscribe();
 *
 * @example
 * // Subscription with indexing
 * const indexedState = new Understate({ initial: { count: 0 }, index: true });
 * indexedState.subscribe((newState, stateId) => {
 *   console.log('State:', newState, 'ID:', stateId);
 * });
 *
 * @example
 * // Chained subscription
 * state
 *   .subscribe(newState => console.log('Subscriber 1:', newState))
 *   .subscribe(newState => console.log('Subscriber 2:', newState))
 *   .set(s => ({ count: s.count + 1 }));
 *
 * @example
 * // Unsubscribe from parent subscriptions
 * const parent = state.subscribe(s => console.log('Parent:', s));
 * const child = parent.subscribe(s => console.log('Child:', s));
 * child.unsubscribe(true); // Unsubscribes both child and parent
 */
Understate.prototype.subscribe =
function(subscription){
    if(typeof subscription !== 'function') throw new Error('Subscription Must be a Function.');
    var original = this;
    original._subscriptions.add(subscription);
    var pointer = Object.create(original);

    /**
     * Unsubscribes the callback from state updates.
     *
     * @description Removes the subscription callback from the update notifications. Optionally
     * can also unsubscribe parent subscriptions in a chained subscription hierarchy.
     *
     * @param {boolean|number} [unsubscribeParents=false] - Controls parent unsubscription behavior.
     *                                                       If false, only unsubscribes this callback.
     *                                                       If true, unsubscribes all parent subscriptions.
     *                                                       If a number, unsubscribes that many levels
     *                                                       of parent subscriptions.
     *
     * @returns {Understate} The original Understate instance
     *
     * @example
     * // Simple unsubscribe
     * const sub = state.subscribe(s => console.log(s));
     * sub.unsubscribe();
     *
     * @example
     * // Unsubscribe with parent cleanup
     * const parent = state.subscribe(s => console.log('Parent:', s));
     * const child = parent.subscribe(s => console.log('Child:', s));
     * child.unsubscribe(true); // Removes both subscriptions
     *
     * @example
     * // Unsubscribe limited parent levels
     * const level1 = state.subscribe(s => console.log('L1:', s));
     * const level2 = level1.subscribe(s => console.log('L2:', s));
     * const level3 = level2.subscribe(s => console.log('L3:', s));
     * level3.unsubscribe(2); // Removes level3 and level2, keeps level1
     */
    pointer.unsubscribe = (unsubscribeParents = false) => {
        original._subscriptions.delete(subscription);
        if(unsubscribeParents){
            if(typeof original.unsubscribe === 'function'){
                if(typeof unsubscribeParents === 'number'){
          //TODO:Also check to ensure that unsubscribeParents is a positive integer
                    return original.unsubscribe(unsubscribeParents - 1);
                }
                return original.unsubscribe(unsubscribeParents);
            }
        }
        return original;
    };
    return pointer;
};

/**
 * Retrieves or indexes the current state ID.
 *
 * @description Returns the unique identifier for the current state. Optionally indexes
 * the current state if the index parameter is true, allowing it to be retrieved later
 * using the get method.
 *
 * @param {boolean} [index=false] - If true, stores the current state in the index map
 *                                  under its current ID for later retrieval
 *
 * @returns {string} The unique ID of the current state
 *
 * @example
 * // Get current state ID without indexing
 * const state = new Understate({ initial: { count: 0 } });
 * const currentId = state.id();
 * console.log(currentId); // "234567890123456" (example)
 *
 * @example
 * // Get and index current state
 * const stateId = state.id(true);
 * // Later, retrieve this exact state version
 * state.get(stateId).then(indexedState => console.log(indexedState));
 *
 * @example
 * // Track state versions
 * const state = new Understate({ initial: { count: 0 } });
 * const id1 = state.id(true);
 * state.set(s => ({ count: 1 }));
 * const id2 = state.id(true);
 * state.set(s => ({ count: 2 }));
 * // Can now retrieve any version
 * state.get(id1).then(s => console.log(s)); // { count: 0 }
 * state.get(id2).then(s => console.log(s)); // { count: 1 }
 */
Understate.prototype.id =
function(index=false){
    if(index) this._indexed.set(this._id, this._state);
    return this._id;
};

export default Understate;
