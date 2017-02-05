function f3(x: number) {
  g3(1);
  g3(x);
}

function g3(x: number) {
  return x + 1;
}

// 3 inference passes