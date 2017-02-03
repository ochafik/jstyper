# typer
Adds flow / typescript types to JavaScript files

Typer adds {TypeScript, Flow, Closure} types to JavaScript programs using iterative type propagation and the TypeScript Language Services.

# Example

input.js:
    
```js
function f(x) {
  return x + 1;
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
  return x + 1;
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