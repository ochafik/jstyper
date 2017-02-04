var foo = require('foo');
var foo1 = foo.foo1;
var foo2 = foo.foo2;

modules.exports = {
  f2: f2,
  g2: g2,
};

foo1(10) == '';
foo2 == 3;

function f2(x, y) {
  return x + 2 + g2(y) + g2(3);
}

function g2(x) {
  return x + 1;
}

function h2(x) {
  return ++x;
}