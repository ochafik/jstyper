function f5(s: string) {
  return s.length == 0 ? '' : s.substring(1);
}

function ff5(s: {length: number;}) {
  return s.length == 0 ? '' : s;
}

function fff5(s: string) {
  return s.substring(1);
}

function g5(s: boolean) {
  return s ? s : '';
}

function h5(x: boolean | {length: number;}) {
  if (ff5(x) == '' && g5(x) == '') {
    console.log('error');
  }
}