require('babel/register')({
  // This will override `node_modules` ignoring - you can alternatively pass
  // an array of strings to be explicitly matched or a regex / glob
  ignore: false
  //Set the experimental proposal stage.
  //More: (http://babeljs.io/docs/usage/experimental/)
  ,stage:0
});
require('./test.js');
