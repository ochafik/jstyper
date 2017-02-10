import {readSpec} from '../src/testing/test_spec';
import {typerTest} from '../src/testing/support';
import * as fs from 'fs';

describe('Typer', () => {
  const specsDir = 'test/specs';
  for (const file of fs.readdirSync(specsDir).filter(n => n.endsWith('.ts'))) {
  // for (const file of fs.readdirSync(specsDir)) {
    it(`converts ${file}`, typerTest(`${specsDir}/${file}`));
  }
});
//   it('infers members called on parameters', typerTest(`
//     function f(x, y) {
//       console.log(x, y);
//       var z = x.call(1, 2);
//       y.foo();
//       g(z);
//       g(x.memberOfX);
//       y(1, 2, 3);
//     }

//     function g(x) {
//       return x * 2;
//     }
//   `));

//   it('propagates vars backwards', typerTest(`
//     function f(xx, y) {
//       var zz1;
//       zz1 = z;
//       zz1 = '';

//       var zz2 = z;
//       zz2 = '';
//       return x + 2 + g(y);
//     }

//     function g(x) {
//       return x * 2;
//     }
//   `));

//   it('types imports', typerTest(`
//     var foo = require('foo');
//     var foo1 = foo.foo1;
//     var foo2 = foo.foo2;

//     modules.exports = {
//       f2: f2,
//       g2: g2,
//     };

//     foo1(10) == '';
//     foo2 == 3;

//     function f2(x, y) {
//       return x + 2 + g2(y) + g2(3);
//     }

//     function g2(x) {
//       return x + 1;
//     }

//     function h2(x) {
//       return ++x;
//     }
//   `));

//   it('detects voids', typerTest(`
//     function f3(x) {
//       g3(1);
//       g3(x);
//     }

//     function g3(x) {
//       return x + 1;
//     }
//   `));

//   it('forwards member detection', typerTest(`
//     function f4(x) {
//       return x * 2;
//     }

//     function g4(x, o) {
//       if (o.addValue) {
//         return f4(x) + o.value;
//       }
//       return o.name == 'default' ? x : 'y';
//     }

//     function gg4(x, y) {
//       var v = g4(x, y);
//       return v;
//     }

//     function h4(x) {
//       return x ? x.length : 0;
//     }
//   `));

//   it('detects string methods', typerTest(`
//     function f5(s) {
//       return s.length == 0 ? '' : s.substring(1);
//     }

//     function ff5(s) {
//       return s.length == 0 ? '' : s;
//     }

//     function fff5(s) {
//       return s.substring(1);
//     }

//     function g5(s) {
//       return s ? s : '';
//     }

//     function h5(x) {
//       if (ff5(x) == '' && g5(x) == '') {
//         console.log('error');
//       }
//     }

//     function i5(x1, x2) {
//       if (x2.y) return x2.y.length;
//       return x1 ? x1.y : null;
//     }
//   `));

//   it('recognizes optional params', typerTest(`
//     function f6(x) {
//       return x && x.y(1) + x.y(1, 2);
//     }

//     function g6(x) {
//       return x && x.y && x.y(1);
//     }
//   `));

//   it('respects class symbols', typerTest(`
//     class Foo { x: number; }

//     function f7(foo: Foo) {
//       return foo ? foo.x : null;
//     }

//     function g7(foo) {
//       return foo ? foo.x : null;
//     }

//     g7(new Foo());
//   `));

//   it('picks good argument names', typerTest(`
//     function f8(x, y, z) {
//       x.foo(y);
//       x.bar(z.getBaz());
//       x.bam(z['yay']);
      
//       let count, superCount, megaCount;
//       x.sum(superCount);
//       x.sum(count);
//       x.sum(megaCount);
//     }
//   `));
// });