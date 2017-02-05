function f1(x: {call(arg1: number, arg2: number): number, memberOfX: number}, y: {(arg1: number, arg2: number, arg3: number): void, foo(): void}) {
  console.log(x, y);
  let z: number = x.call(1, 2);
  y.foo();
  g1(z);
  g1(x.memberOfX);
  y(1, 2, 3);

  // var zz1;
  // zz1 = z;
  // zz1 = '';

  // var zz2 = z;
  // zz2 = '';
  // return x + 2 + g1(y);
}

function g1(x: number) {
  return x * 2;
}