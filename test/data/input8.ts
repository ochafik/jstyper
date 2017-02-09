function f8(x: {foo(y: any): void, bar(baz: any): void, bam(yay: any): void, sum(count: any): void}, y, z: {getBaz(): any}): void {
  x.foo(y);
  x.bar(z.getBaz());
  x.bam(z['yay']);

  let count, superCount, megaCount;
  x.sum(superCount);
  x.sum(count);
  x.sum(megaCount);
}

// 2 inference passes