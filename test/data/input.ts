  function f0(x: number | {call: (arg1: number, arg2: number) => number, memberOfX: number}, y: number | {foo: () => void, (arg1: number, arg2: number, arg3: number): void}) {
    console.log(x, y);
    let z: number = x.call(1, 2);
    y.foo();
    g(z);
    g(x.memberOfX);
    y(1, 2, 3);

    let zz;
    zz = z;
    zz = '';
    return x + 2 + g(y);
  }

  function g(x: number) {
    return x * 2;
  }