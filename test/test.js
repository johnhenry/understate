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
(new Understate({index:true}))//Orignal Instance
.s(initialize).subscribe(idLog)//New Instance
.s(add(1)).unsubscribe()//Orignal Instance
.s(add(2)).subscribe(idLog)//New Instance
.s(add(3)).unsubscribe()//Orignal Instance
.s(add(4)).subscribe(idLog)//New Instance
.s(add(5)).unsubscribe()//Orignal Instance
.s(add(6)).subscribe(idLog)//New Instance
.s(add(7)).unsubscribe()//Orignal Instance
.s(add(8)).subscribe(idLog)//New Instance
.s(add(9)).unsubscribe();//Orignal Instance
