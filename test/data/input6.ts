function f6(x?: {y(arg1: number, arg2?: number): any}) {
  return x && x.y(1) + x.y(1, 2);
}

function g6(x?: {y?: (arg1: number) => boolean}): boolean {
  return x && x.y && x.y(1);
}


// 3 inference passes