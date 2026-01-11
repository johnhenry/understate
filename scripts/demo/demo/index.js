import { Understate } from './../PROJECT/dist';
const log   = value => console.log(value);
const increment = x => x + 1;
const state     = new Understate({initial: 0});
state.subscribe(log);
state.set(increment);//1
state.set(increment);//2
state.set(increment);//3
