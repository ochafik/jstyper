function f3(x: number) {
  g3(1);
  g3(x);
}

function g3(x: number): number {
  return x + 1;
}

// 5 inference passes