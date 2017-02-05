function f6(x) {
  return x && x.y(1) + x.y(1, 2);
}

function g6(x) {
  return x && x.y && x.y(1);
}
