# typer
Adds flow / typescript types to JavaScript files

Typer adds {TypeScript, Flow, Closure} types to JavaScript programs using iterative type propagation and the TypeScript Language Services.

# Demo

[Run it here](https://goo.gl/5lkE11)
* [Gist](https://gist.github.com/ochafik/f69b7e7b11bc0c41631e0bd17800e932)
* [Short-link analytics](https://goo.gl/#analytics/goo.gl/5lkE11/all_time)

# Example

input.js:
    
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
  var v = gg(x, y);
  return v;
}
```

output.ts:

```ts    
function f(x: number) {
  return x * 2;
}

function g(x: number, o: {addValue: boolean, value: number, name: string}): number | string {
  if (o.addValue) {
    return f(x) + o.value;
  }
  return o.name == 'default' ? x : 'y';
}

function gg(x: number, o: {addValue: boolean, value: number, name: string}) {
  var v: string | number = g(x, y);
  return v;
}
```

# Run it

- Clone this repo
- Run `npm i`
- Run `node build/main.js <your .js files>`

# TODO

- Better propagate contextual types in expressions (e.g. in `(a && b && c`, `a ? b : c`)
- Use type constraints instead of types to allow local inference passes
- Support of nominal types in existing TS files
- Generate .d.ts automagically
- Handle index operators