# jstyper [![Build Status](https://travis-ci.org/ochafik/jstyper.svg?branch=master)](https://travis-ci.org/ochafik/jstyper) [![npm version](https://badge.fury.io/js/jstyper.svg)](https://badge.fury.io/js/jstyper)
Adds flow / typescript types to JavaScript files

JsTyper adds {TypeScript, Flow, Closure} types to JavaScript programs using iterative type propagation and the TypeScript Language Services.

# Run it

* [Interactive online demo](http://ochafik.com/assets/typer-demo.html)
* `npm i -g jstyper` then `jstyper input.js`
  * Noteworthy flags:
    * `-o <outputDir>` (or `--outputDir=<outputDir>`): where files should be generated
    * `--declarations`: only generate interface files (`*.d.ts`)

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

# Hack it

- Clone this repo
- Run `npm i`
- Debug the demo `npm start` (will auto-reload and auto-run tests after any changes made to the TypeScript sources)
- More options: take a look at [package.json's script entries](./package.json)

# TODO

- parse and output flow comment / flow types
- Split large tests into smaller specs
- Better propagate contextual types in expressions (e.g. in `(a && b && c`, `a ? b : c`)
- Use type constraints instead of types to allow local inference passes
- Support merging of symbols added after structural members `{x: number} | Foo`
- Handle index operators
- Infer `x: Promise<T>` from `(await x): T`
