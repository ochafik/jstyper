class Foo {x: number;}

function f7(foo?: Foo): number | null {
  return foo ? foo.x : null;
}

function g7(foo?: Foo): number | null {
  return foo ? foo.x : null;
}

g7(new Foo());

// 3 inference passes