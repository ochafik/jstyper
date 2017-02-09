function f8(x, y, z) {
  x.foo(y);
  x.bar(z.getBaz());
  x.bam(z['yay']);
  
  let count, superCount, megaCount;
  x.sum(superCount);
  x.sum(count);
  x.sum(megaCount);
}