//Minimal localStorage Shim
const m = new Map();
const storage = Object.create(null);
storage.getItem = k=>m.get(k);
storage.setItem = (k,v)=>m.set(k,v);
export default storage;
