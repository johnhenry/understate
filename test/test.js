//Imports-----------------------------------------------------------------------
import Understate from '..';
import {getStorage, setLatest, LATESTID} from './storage';
//Test1-------------------------------------------------------------------------
{
  //State-----------------------------------------------------------------------
  const DEFAULTSTATE = 0;
  //State Mutators--------------------------------------------------------------
  const constant = a => _ => a;
  const add = a => b => a + b;
  const initialize = constant(getStorage(LATESTID) || DEFAULTSTATE);
  //Utilities-------------------------------------------------------------------
  const log = (state, id = undefined) => {
    if(id !== undefined) setLatest(id, state);
    console.log(`ID: ${id}
  STATE: ${state}`);
  };
  //Run-------------------------------------------------------------------------
  (new Understate({index:true}))//Orignal Instance
  .s(initialize).subscribe(log)//New Instance
  .s(add(1)).unsubscribe()//Orignal Instance
  .s(add(2)).subscribe(log)//New Instance
  .s(add(3)).unsubscribe()//Orignal Instance
  .s(add(4)).subscribe(log)//New Instance
  .s(add(5)).unsubscribe()//Orignal Instance
  .s(add(6)).subscribe(log)//New Instance
  .s(add(7)).unsubscribe()//Orignal Instance
  .s(add(8)).subscribe(log)//New Instance
  .s(add(9)).unsubscribe();//Orignal Instance
}
