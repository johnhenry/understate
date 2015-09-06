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
var idLog = (state, id = undefined) => {
  if(id !== undefined) setLatest(id, state);
  console.log(`ID: ${id}
STATE: ${state}`);
};
// var s = new Reinstate({});
// s.subscribe(idLog);
// s.set(initialize, true);
// s.set(add(1), true);
// s.set(add(2), true);
// s.set(add(3), true);
// s.set(add(4), true);
// s.set(add(5), true);
// s.set(add(6), true);
// s.set(add(7), true);
// s.set(add(8), true);
// s.set(add(9), true);

// var s = (new Reinstate({index:true}))
// .s(initialize)
// .subscribe(idLog)
// .s(add(1))
// .s(add(2))
// .s(add(3))
// .s(add(4))
// .s(add(5))
// .s(add(6))
// .s(add(7))
// .s(add(8))
// .s(add(9));

var s = new Reinstate({});
var t = s.subscribe(_=>console.log(_));
t.set(initialize, true);
s.set(add(1));//1
t.set(add(1));//2
s.set(add(1));//3
t.set(add(1));//4
s.set(add(1));//5
t.unsubscribe();
s.set(add(1));//(Logs Nothing)
t.set(add(1));//(Logs Nothing)
//s.unsubscribe();//(Throws Error)
