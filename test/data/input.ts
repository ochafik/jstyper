  function f0(x: number | string | {call: (arg1: number, arg2: number) => any, memberOfX: any}, y: {foo: () => void, (arg1: number, arg2: number, arg3: number): void}) {
    console.log(x, y);
    let z = x.call(1, 2);
    y.foo();
    g(z);
    g(x.memberOfX);
    y(1, 2, 3);

    return x + 2 + g(y);
  }

  function g(x: number | string) {
    return x + 1;
  }