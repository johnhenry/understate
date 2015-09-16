//Imports-----------------------------------------------------------------------
import Understate from '..';
import assert from 'assert';
import {getStorage, setLatest, LATESTID} from './storage';
//Utilities-------------------------------------------------------------------
 var log = (state, id = undefined) => {
   if(id !== undefined) setLatest(id, state);
   console.capture(`ID: ${id}
STATE: ${state}`);
 };

//Test0-------------------------------------------------------------------------
{
  describe('Constructor', function() {
    describe('(Empty)', function () {
      it('It should not have an initial value', function (done) {
        const understate = new Understate();
        understate.get().then(state=>{
          assert.equal(state, undefined);
          done();
        })
      });
    });
    describe('Initial Value', function () {
      it('It should have an initial value. ', function (done) {
        const understate = new Understate({initial:null});
        understate.get().then(state=>{
          assert.equal(state, null);
          done();
        })
      });
    });
  });
}
//Test1-------------------------------------------------------------------------
{
  describe('Susbscription', function() {
    describe('(Empty)', function () {
      it('...', function (done) {
        const arr = [];
        const capture = state=>arr.push(state);
        //State---------------------------------------------------------------
        const DEFAULTSTATE = 0;
        //State Mutators--------------------------------------------------------
        const constant = a => _ => a;
        const add = a => b => a + b;
        const initialize = constant(getStorage(LATESTID) || DEFAULTSTATE);
        (new Understate({index:true}))//Original Instance
        .s(initialize).subscribe(capture)//New Instance
        .s(add(1)).unsubscribe()//Original Instance
        .s(add(2)).subscribe(capture)//New Instance
        .s(add(3)).unsubscribe()//Original Instance
        .s(add(4)).subscribe(capture)//New Instance
        .s(add(5)).unsubscribe()//Original Instance
        .s(add(6)).subscribe(capture)//New Instance
        .s(add(7)).unsubscribe()//Original Instance
        .s(add(8)).subscribe(capture)//New Instance
        .s(add(9)).unsubscribe();//Original Instance
        assert.deepEqual(arr, [1, 6, 15, 28, 45]);
        done();
      });
    });
  });
}
//Test2-------------------------------------------------------------------------
{
  describe('Async', function() {
    describe('(Empty)', function () {
      it('...', function (done) {
        //Builders
        var constant    = a => _ => a;
        var addMessageAsync  = message => messages => new Promise((resolve, reject)=>{
        //  if(Math.random() < 0.25) return reject(new Error('Simulated Async Failure'));
          return setTimeout(()=>resolve(messages.concat(message)), 0);
        });
        //Mutators
        var empty       = constant([]);
        //App
        var messages    = new Understate({asynchronous:true});
        messages.set(empty,{asynchronous:false});
        messages.set(addMessageAsync('Hello'))
          .then(_=>messages.set(addMessageAsync('there'))
          .then(_=>messages.set(addMessageAsync('John.'))
          .then(()=>messages.get().then(result=>{
            assert.deepEqual(result, ["Hello","there","John."]);
            done();
          }))));
      });
    });
  });
}
