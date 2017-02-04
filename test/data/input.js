  function f1(x, y) {
    console.log(x, y);
    var z = x.call(1, 2);
    y.foo();
    g1(z);
    g1(x.memberOfX);
    y(1, 2, 3);
    
    // var zz1;
    // zz1 = z;
    // zz1 = '';

    // var zz2 = z;
    // zz2 = '';
    // return x + 2 + g1(y);
  }

  function g1(x) {
    return x * 2;
  }