# jstyper [![Build Status](https://travis-ci.org/ochafik/jstyper.svg?branch=master)](https://travis-ci.org/ochafik/jstyper) [![npm version](https://badge.fury.io/js/jstyper.svg)](https://badge.fury.io/js/jstyper)
Turns your JavaScript to TypeScript / Flow (adds types, converts requires to imports, etc); *ALPHA QUALITY*

JsTyper adds {TypeScript, Flow, Closure} types to JavaScript programs using iterative type propagation and the TypeScript Language Services.

# Run it

* [Interactive online demo](http://ochafik.com/assets/typer-demo.html)
* `npm i -g jstyper` then `jstyper input.js`
  * Noteworthy flags:
    * `-o <outputDir>` (or `--outputDir=<outputDir>`): where files should be generated
    * `--declarations`: only generate interface files (`*.d.ts`)

# Features

(take a look at [our tests](https://github.com/ochafik/jstyper/tree/master/test/specs))

- Assumes your JS code is correct, and propagates inferred types globally (across different files):
  - From call sites: if you call `f(1)`, it will assume `function f` can take a `number` argument. If you call `f()` somewhere else, it will assume that argument is optional.
  - From function bodies: in `function f(x) { return x * 2 }` it's obvious `x` must be a `number`. Similar constraints appear when you test arguments for nullity or for equality with other values, etc.
  - From call shapes: from `x.y() * x.n;` it infers `x: {y(): void, readonly n: number}`
- Rewrites `require` & `module.exports` to ES2015 (ES6) imports & exports
- Supports writing declarations (`*.d.ts`) files only with the `--declarations` flag.
- Writes definitions for imported / required module interfaces (e.g. if you `var foo = require('foo'); foo.bar()` it will infer `declare module "foo" { export function bar(): void }`)
- Rewrites `var` to `let`

# Example

example.js:
    
```js
function f(x) {
  return x * 2;
}

function g(x, o) {
  if (o.addValue) {
    return f(x) + o.value;
  }
  return o.name == 'default' ? x : 'y';
}

function gg(x, y) {
  var v = g(x, y);
  return v;
}
```

example.ts:

```js    
function f(x: number): number {
  return x * 2;
}

function g(x: number, o: {addValue: boolean, value: any, name: string}) {
  if (o.addValue) {
    return f(x) + o.value;
  }
  return o.name == 'default' ? x : 'y';
}

function gg(x: number, y: {addValue: boolean, value: any, name: string}) {
  let v = g(x, y);
  return v;
}
```

# TODO

- Bundle & support DOM & ES2015+ libs
- Support `var foo = require('./bar').foo` pattern
- Support `var Foo = function() {}; Foo.prototype.bar = ...` (create companion `interface Foo { bar... }`)
- Parse and output flow comment / flow types (+ compare with Flow)
- Lint mode
- Split large tests into smaller specs
- Better propagate contextual types in expressions (e.g. in `(a && b && c`, `a ? b : c`)
- Use type constraints instead of types to allow local inference passes
- Support merging of symbols added after structural members `{x: number} | Foo`
- Handle index operators
- Infer `x: Promise<T>` from `(await x): T`
- WebDriver test for demo
- Support literal types
- Use `const` when appropriate in `var` rewrite.
- Proper cli args parsing + `--help`
- Better `new F()` class creation inference

# Hack it

- Clone this repo
- Run `npm i`
- Debug the demo `npm start` (will auto-reload and auto-run tests after any changes made to the TypeScript sources)
- More options: take a look at [package.json's script entries](./package.json)
