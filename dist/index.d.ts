/**
 * Configuration options for creating an Understate instance.
 */
export interface UnderstateConfig {
  /**
   * The initial state value of the instance
   * @default undefined
   */
  initial?: any;

  /**
   * If true, states will be automatically indexed upon update
   * @default false
   */
  index?: boolean;

  /**
   * If true, state updates will be handled asynchronously
   * @default false
   */
  asynchronous?: boolean;
}

/**
 * Configuration options for state update operations.
 */
export interface SetConfig {
  /**
   * Override instance-level index setting for this update
   */
  index?: boolean;

  /**
   * Override instance-level asynchronous setting for this update
   */
  asynchronous?: boolean;

  /**
   * Reserved for future use
   */
  initial?: any;
}

/**
 * State mutation function that transforms the current state.
 * @param currentState - The current state value
 * @returns The new state value, or a Promise resolving to the new state
 */
export type MutatorFunction<T = any> = (currentState: T) => T | Promise<T>;

/**
 * Subscription callback function invoked after state updates.
 * @param newState - The updated state value
 * @param stateId - The ID of the new state (if indexing is enabled)
 */
export type SubscriptionCallback<T = any> = (newState: T, stateId?: string) => void;

/**
 * Object returned from subscription with unsubscribe capability.
 */
export interface SubscriptionPointer<T = any> {
  /**
   * Method to cancel the subscription
   * @param unsubscribeParents - If true or a number, unsubscribes parent subscriptions too
   * @returns The original Understate instance
   */
  unsubscribe(unsubscribeParents?: boolean | number): Understate<T>;

  /**
   * Inherited set method from Understate instance
   */
  set(mutator: MutatorFunction<T>, config?: SetConfig): Promise<T>;

  /**
   * Inherited get method from Understate instance
   */
  get(id?: string | false): Promise<T>;

  /**
   * Inherited subscribe method from Understate instance
   */
  subscribe(subscription: SubscriptionCallback<T>): SubscriptionPointer<T>;
}

/**
 * A lightweight state management library for tracking and subscribing to state changes.
 * Supports synchronous and asynchronous state updates, optional state indexing, and subscription management.
 */
export class Understate<T = any> {
  /**
   * Creates a new Understate state management instance.
   *
   * Understate provides a simple but powerful way to manage state with support for:
   * - Synchronous and asynchronous state updates
   * - State indexing and historical state retrieval
   * - Subscription-based reactivity
   * - Method chaining for fluent APIs
   *
   * @param config - Configuration options for the instance
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
  constructor(config?: UnderstateConfig);

  /**
   * Updates the current state by applying a mutator function.
   *
   * This is the primary method for modifying state. It applies the mutator function
   * to the current state, updates internal state, notifies subscribers, and optionally
   * indexes the new state.
   *
   * @param mutator - Function to transform the current state
   * @param config - Configuration options for this update
   * @returns Promise resolving to the new state (and state ID if indexing is enabled)
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
  set(mutator: MutatorFunction<T>, config?: SetConfig): Promise<T>;

  /**
   * Updates the current state and returns the Understate instance for method chaining.
   *
   * This is a convenience method that combines `set()` with fluent interface support.
   * Useful for chaining multiple operations together.
   *
   * @param mutator - Function to transform the current state
   * @param config - Configuration options for this update
   * @returns The Understate instance for method chaining
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
  s(mutator: MutatorFunction<T>, config?: SetConfig): this;

  /**
   * Retrieves the current state or a previously indexed state by ID.
   *
   * When called without arguments, returns the current state and its ID.
   * When called with a state ID, returns the indexed state for that ID.
   *
   * @param id - The ID of a previously indexed state, or false for current state
   * @returns Promise resolving to the requested state value
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
  get(id?: string | false): Promise<T>;

  /**
   * Subscribes to state updates with a callback function.
   *
   * The subscription callback will be invoked whenever the state is updated via `set()`.
   * Returns a subscription pointer object with an `unsubscribe()` method to cancel
   * the subscription.
   *
   * @param subscription - Callback invoked after each state update
   * @returns Object with unsubscribe method and inherited Understate methods
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
  subscribe(subscription: SubscriptionCallback<T>): SubscriptionPointer<T>;

  /**
   * Returns the current state ID and optionally indexes the current state.
   *
   * Each state update generates a new unique ID. This method retrieves that ID
   * and can optionally save the current state to the index for later retrieval.
   *
   * @param index - If true, indexes the current state with its ID
   * @returns The unique identifier of the current state
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
  id(index?: boolean): string;
}

/**
 * Generates a unique identifier for state snapshots.
 * Creates a pseudo-random ID by converting a random number to a string.
 *
 * @returns A 15-character unique identifier string
 * @throws {Error} If random number generation fails
 *
 * @example
 * const stateId = generateId(); // "384756201938475"
 */
export function generateId(): string;
