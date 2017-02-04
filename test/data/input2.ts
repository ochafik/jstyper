let foo: {foo1(arg1: number): string; foo2: number;} = require('foo');
let foo1: (arg1: number) => string = foo.foo1;
let foo2: number = foo.foo2;

modules.exports = {
  f2: f2,
  g2: g2,
};

foo1(10) == '';
foo2 == 3;

function f2(x, y: number) {
  return x + 2 + g2(y) + g2(3);
}

function g2(x: number) {
  return x + 1;
}

function h2(x: number) {
  return ++x;
}