function f(x, y) {
  console.log(x, y);
  let z = x.call(1, 2);
  y.foo();
  g(z);
  g(x.memberOfX);
  y(1, 2, 3);
  
  return x + 2 + g(y);
}

function g(x) {
  return x + 1;
}

// x + 1
// g.x -> z -> ret(x.call(number, number))