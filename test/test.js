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
  (new Understate({index:true}))//Original Instance
  .s(initialize).subscribe(log)//New Instance
  .s(add(1)).unsubscribe()//Original Instance
  .s(add(2)).subscribe(log)//New Instance
  .s(add(3)).unsubscribe()//Original Instance
  .s(add(4)).subscribe(log)//New Instance
  .s(add(5)).unsubscribe()//Original Instance
  .s(add(6)).subscribe(log)//New Instance
  .s(add(7)).unsubscribe()//Original Instance
  .s(add(8)).subscribe(log)//New Instance
  .s(add(9)).unsubscribe();//Original Instance
}
//Test2-------------------------------------------------------------------------

{
  var state = new Understate({initial:0, asynchronous:true});
  var log = value => console.log(value);
  //Builders
  var constant    = a => _ => a;
  var addMessageAsync  = message => messages => new Promise((resolve, reject)=>{
    if(Math.random() < 0.25) return reject(new Error('Simulated Async Failure'));
    return setTimeout(()=>resolve(messages.concat(message)), 1000);
  });
  //Mutators
  var empty       = constant([]);
  //App
  var messages    = new Understate({asynchronous:true, initial:[]});
  messages.subscribe(log);
  messages.set(addMessageAsync('Hello'))
    .then(_=>messages.set(addMessageAsync('there'))
    .then(_=>messages.set(addMessageAsync('John.'))))
  .catch(log);
  //[]
  //['Hello']
  //['Hello', 'there']
  //['Hello', 'there', 'John.']
  //OR
  //[Error: Simulated Async Failure]
}
