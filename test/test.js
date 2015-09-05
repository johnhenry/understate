//Imports-----------------------------------------------------------------------
import Reinstate from '..';
import {getStorage, setStorage, setLatest} from './storage';
//State-------------------------------------------------------------------------
var DEFAULTSTATE = 0;
//State Mutators----------------------------------------------------------------
var constant = a => _ => a;
var add = a => b => a + b;
var initialize = constant(getStorage() || DEFAULTSTATE);
//Test--------------------------------------------------------------------------
var s = new Reinstate({});
s.subscribe((state, id = undefined) => {
  if(id !== undefined) setLatest(id, state);
  console.log(`ID: ${id}
STATE: ${state}`);
});
s.set(initialize, true);
s.set(add(1), true);
s.set(add(2), true);
s.set(add(3), true);
s.set(add(4), true);
s.set(add(5), true);
s.set(add(6), true);
s.set(add(7), true);
s.set(add(8), true);
s.set(add(9), true);
