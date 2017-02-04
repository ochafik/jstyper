function f4(x: number) {
  return x * 2;
}

function g4(x: number, o: {addValue: boolean; value: any; name: string;}) {
  if (o.addValue) {
    return f4(x) + o.value;
  }
  return o.name == 'default' ? x : 'y';
}

function gg4(x: number, y: {addValue: boolean; value: any; name: string;}) {
  let v = g4(x, y);
  return v;
}

function h4(x: undefined | {length: any;}) {
  return x ? x.length : 0;
}