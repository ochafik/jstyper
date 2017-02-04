function f5(s) {
  return s.length == 0 ? '' : s.substring(1);
}

function ff5(s) {
  return s.length == 0 ? '' : s;
}

function g5(s) {
  return s ? s : '';
}

function h5(x) {
  if (ff5(x) == '' && g5(x) == '') {
    console.log('error');
  }
}