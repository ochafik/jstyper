function f6(x?: {y(arg1: number, arg2?: number): any}) {
  return x && x.y(1) + x.y(1, 2);
}

// 2 inference passes