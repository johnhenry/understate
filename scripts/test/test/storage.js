import { storage as localStorage } from './notLocalStorage.js';

/**
 * The key used to store the latest ID in storage
 * @constant {string}
 */
const LATESTID = "LATEST";
//Test =========================================================================
//Storage-----------------------------------------------------------------------
/**
 * Deserializes data from storage by converting it to a number
 * @param {string} data - The serialized data to deserialize
 * @returns {number} The deserialized numeric value
 */
const deserialize = function(data){
  return Number(data);
};

/**
 * Serializes data for storage by converting it to a string
 * @param {*} data - The data to serialize
 * @returns {string} The serialized string value
 */
const serialize = function(data){
  return String(data);
};

/**
 * Retrieves data from storage for the given key
 * @param {string} [key=LATESTID] - The storage key to retrieve (defaults to LATESTID)
 * @returns {number} The deserialized value from storage
 */
const getStorage = function(key = LATESTID){
  return deserialize(
      localStorage.getItem(key));
};

/**
 * Stores data in storage with the given key
 * @param {string} key - The storage key to use
 * @param {*} value - The value to serialize and store
 * @returns {*} The result of the storage operation
 */
const setStorage = function(key, value){
  return localStorage.setItem(
      key,
      serialize(value));
};

/**
 * Stores a state value with an ID and updates the latest ID reference
 * @param {string} id - The ID to associate with the state
 * @param {*} state - The state value to store
 */
const setLatest = function(id, state){
  setStorage(id, state);
  setStorage(LATESTID, id);
}
export {
  getStorage,
  setStorage,
  setLatest,
  LATESTID
}
