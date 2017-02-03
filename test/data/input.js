function f0(x, y) {
  console.log(x, y);
  let z = x.call(1, 2);
  y.foo();
  g(z);
  g(x.memberOfX);
  y(1, 2, 3);
  
  return x + 2 + g(y);
}

var x = 10;
var foo = require('foo')
var foo1 = foo.foo1;
var foo2 = foo.foo2;

modules.exports = {
  f: f,
  g: g,
};

foo1(10) == '';

function f(x, y) {
  return x + 2 + g(y);
}

function g(x) {
  return x + 1;
}