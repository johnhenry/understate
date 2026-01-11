import { storage as localStorage } from './notLocalStorage.js';
const LATESTID = "LATEST";
//Test =========================================================================
//Storage-----------------------------------------------------------------------
const deserialize = function(data){
  return Number(data);
};
const serialize = function(data){
  return String(data);
};
const getStorage = function(key = LATESTID){
  return deserialize(
      localStorage.getItem(key));
};
const setStorage = function(key, value){
  return localStorage.setItem(
      key,
      serialize(value));
};
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
