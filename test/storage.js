import localStorage from './notLocalStorage.js';
const LATESTID = "LatestID";
//Test =========================================================================
//Storage-----------------------------------------------------------------------
var deserialize = function(data){
  return Number(data);
};
var serialize = function(data){
  return String(data);
};
var getStorage = function(key = LATESTID){
  return deserialize(
      localStorage.getItem(key));
};
var setStorage = function(key, value){
  return localStorage.setItem(
      key,
      serialize(value));
};
var setLatest = function(id, state){
  setStorage(id, state);
  setStorage(LATESTID, id);
}
export default {
  getStorage,
  setStorage,
  setLatest
}
