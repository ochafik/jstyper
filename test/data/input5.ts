function f5(s: string) {
  return s.length == 0 ? '' : s.substring(1);
}

function ff5(s: string) {
  return s.length == 0 ? '' : s;
}

function g5(s: boolean) {
  return s ? s : '';
}

function h5(x: string | boolean) {
  if (ff5(x) == '' && g5(x) == '') {
    console.log('error');
  }
}