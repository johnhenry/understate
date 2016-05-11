'use strict';

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
var Understate = function(config={}){
  config = Object.assign({initial:undefined, index:false, asynchronous:false}, config);
  var index = config.index;
  var initial = config.initial;
  var asynchronous = config.asynchronous;

  var _state = initial, _id;
  this._getState = _ => _state;
  this._setState = _ => _state = _;
  this._getId = _=>_id;
  this._setId = _=>_id = _;
  this._setId(id(this._getState()));
  this._index = !!index;
  this._asynchronous = !!asynchronous;
  this._subscriptions = new Set();
  this._indexed = new Map();
  if(this._index) this._indexed.set(this._getId(),this._getState());
  return this;
}
/**
 * Set - Updates the current state of the reinstate instance
 * @param {function} mutator -- function to manipulate the current state
 * @param {boolean} [index=false] -- if true, the updated state will be indexed by it's current id
 * @return {Promise} -- A promise resolved with the current state.
 */
Understate.prototype.set =
function(mutator, config={}){
  if(typeof mutator !== 'function') throw new Error("Mutator Must be a Function.");
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
        };
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
}

/**
 * S - Updates the current state of the reinstate instance and returns the original reinstate object. Useful for chaining.
 * @param {function} mutator -- function to manipulate the current state
 * @param {boolean} [index=false] -- if true, the updated state will be indexed by it's current id
 * @return {Reinstate} -- The original reinstate instance
 */
Understate.prototype.s = function(mutator, config={}){
  this.set(mutator, config);
  return this;
}
/**
 * Get -- Retreives the current state of the reinstate instance
 * @param {string} [id] -- the id of the state to retreive. If not passed, the current state will be retreived
 * @return {Promise} -- A promise resolved with the current state. If no id is passed, the promise will be resolved with the current id as the second argument
 */
Understate.prototype.get =
function(id = false){
  return new Promise(resolve => {
    if(id === false) return resolve(this._getState(), this._getId());
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

module.exports = Understate;