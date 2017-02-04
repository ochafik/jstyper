function f4(x) {
  return x * 2;
}

function g4(x, o) {
  if (o.addValue) {
    return f4(x) + o.value;
  }
  return o.name == 'default' ? x : 'y';
}

function gg4(x, y) {
  var v = g4(x, y);
  return v;
}

function h4(x) {
  return x ? x.length : 0;
}