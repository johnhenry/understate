//Imports-----------------------------------------------------------------------
import Understate from '..';
import {getStorage, setLatest, LATESTID} from './storage';
//State-------------------------------------------------------------------------
var DEFAULTSTATE = 0;
//State Mutators----------------------------------------------------------------
var constant = a => _ => a;
var add = a => b => a + b;
var initialize = constant(getStorage(LATESTID) || DEFAULTSTATE);
//Test--------------------------------------------------------------------------
var idLog = (state, id = undefined) => {
  if(id !== undefined) setLatest(id, state);
  console.log(`ID: ${id}
STATE: ${state}`);
};
(new Understate({index:true}))
.s(initialize).subscribe(idLog)
.s(add(1)).unsubscribe()
.s(add(2)).subscribe(idLog)
.s(add(3)).unsubscribe()
.s(add(4)).subscribe(idLog)
.s(add(5)).unsubscribe()
.s(add(6)).subscribe(idLog)
.s(add(7)).unsubscribe()
.s(add(8)).subscribe(idLog)
.s(add(9)).unsubscribe();
