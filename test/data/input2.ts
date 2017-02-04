  let foo: {foo1: (arg1: number) => string, foo2: number} = require('foo');
  let foo1: (arg1: number) => string = foo.foo1;
  let foo2: number = foo.foo2;

  modules.exports = {
    f: f,
    g: g,
  };

  foo1(10) == '';
  foo2 == 3;

  function f(x: number, y: number) {
    return x + 2 + g(y);
  }

  function g(x: number) {
    return x + 1;
  }

  function h(x: number) {
    return ++x;
  }