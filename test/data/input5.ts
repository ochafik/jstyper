function f5(s: string) {
  return s.length == 0 ? '' : s.substring(1);
}

function ff5(s: boolean | {length: number}) {
  return s.length == 0 ? '' : s;
}

function fff5(s: string) {
  return s.substring(1);
}

function g5(s: boolean | {length: number}) {
  return s ? s : '';
}

function h5(x: boolean | {length: number}) {
  if (ff5(x) == '' && g5(x) == '') {
    console.log('error');
  }
}

function i5(x1: undefined | {y: any}, x2: {y: string}) {
  if (x2.y) return x2.y.length;
  return x1 ? x1.y : null;
}

// 5 inference passes