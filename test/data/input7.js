class Foo { x: number; }

function f7(foo: Foo) {
  return foo ? foo.x : null;
}

function g7(foo) {
  return foo ? foo.x : null;
}

g7(new Foo());