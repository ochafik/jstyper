  var foo = require('foo');
  var foo1 = foo.foo1;
  var foo2 = foo.foo2;

  modules.exports = {
    f: f,
    g: g,
  };

  foo1(10) == '';
  foo2 == 3;

  function f(x, y) {
    return x + 2 + g(y);
  }

  function g(x) {
    return x + 1;
  }

  function h(x) {
    return ++x;
  }