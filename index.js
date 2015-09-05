//Library=======================================================================
/**
 * ID Function - Emits and id
 * Should probably be a hash
 * @param {integer} -- data The id of the employee.
 * @return {string} -- An id String.
 */
var id = function(data){
  return String(Math.random()).substr(2, 15);
}
/**
 * Constructor Creates a new Understate Object.
 * @constructor
 * @config {*any} [initial=undefined] -- the initial state of the instance.
 * @config {boolean} [index=false] -- if true, states will be automatically indexed upon update
 */
var Understate = function({initial=undefined, index=false}){
  this._state = initial;
  this._id = id(this._state);
  this._index = index;
  this._subscriptions = new Set();
  this._indexed = new Map();
  if(this._index) this._indexed.set(this._id, this._state);
  return this;
}
/**
 * Set - Updates the current state of the reinstate instance
 * @param {function} mutator -- function to manipulate the current state
 * @param {boolean} [index=false] -- if true, the updated state will be indexed by it's current id
 * @return {Promise} -- A promise resolved with the current state.
 */
Understate.prototype.set =
function(mutator, index=false){
  this._state = mutator(this._state);
  this._id = id(this._state);
  return new Promise((resolve, reject) => {
    var result;
    if(!!index || (index !== false && this._index)){
      result = Object.create(null);
      result.id = this._id;
      result.state = this._state;
      this._indexed.set(result.id, this._state);
      this._subscriptions.forEach((subscription) => subscription(result.state, result.id));
    }else{
      result = this._state;
      this._subscriptions.forEach((subscription) => subscription(result));
    };
    return resolve(result);
  });
}
/**
 * Get -- Retreives the current state of the reinstate instance
 * @param {string} [id] -- the id of the state to retreive. If not passed, the current state will be retreived
 * @return {Promise} -- A promise resolved with the current state. If no id is passed, the promise will be resolved with the current id as the second argument
 */
Understate.prototype.get =
function(id = false){
  return new Promise((resolve, reject) => {
    if(id === false) return resolve(this._state, this._id);
    resolve(this._indexed.get(id));
  });
};
/**
 * Subscribe -- Subscribe to updates the reinstate instances updates
 * @param {function} subscribe -- callback to be called after state us updated
 * @return {object} -- an object with an unsubscribe method that can be called to cancel the subscription.
 */
Understate.prototype.subscribe =
function(subscription){
  if(typeof subscription !== 'function') throw new Error("Subscription Must be a Function.");
  var original = this;
  original._subscriptions.add(subscription);
  var pointer = Object.create(original);
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
  }
  return pointer;
}
/**
 * Subscribe -- Subscribe to updates the reinstate instances updates
 * @param {boolean} [index=false] -- if true, the current state will be indexed by it's current id
 * @return {string} -- the id of the current state
 */
Understate.prototype.id =
function(index=false){
  if(index) this._indexed.set(this._id, this._state);
  return this._id;
};
export default Understate;
