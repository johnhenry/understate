//Minimal localStorage Shim
var m = new Map();
var storage = Object.create(null);
storage.getItem = k=>m.get(k);
storage.setItem = (k,v)=>m.set(k,v);
export { storage };
