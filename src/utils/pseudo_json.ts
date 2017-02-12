
export function pseudoJson(
    obj: any, indent: string = '', indentMultilineStrings: boolean = false) {
  if (typeof obj == 'number' || typeof obj == 'boolean' || obj == null) {
    return `${obj}`;
  } else if (typeof obj == 'string') {
    let str = obj;
    if (obj.indexOf('\n') >= 0) {
      const lineIndent = '\n' + indent;
      str = lineIndent + '  ' +
          obj.replace(new RegExp('\n', 'g'), lineIndent + '  ') + lineIndent;
    }
    return '`' + str.replace(/([$`])/g, '\\$1') + '`';
  } else {
    const sub = indent + '  ';
    if (obj instanceof Array) {
      return '[\n' + indent +
          (obj as any[])
              .map(o => pseudoJson(o, sub, indentMultilineStrings))
              .join(',\n' + sub) +
          '\n' + indent + ']';
    } else {
      return '{\n' + sub +
          Object.keys(obj)
              .map(key => {
                const value = obj[key];
                return (/[^\w]/.test(key) ?
                            `'` + key.replace(/'\//, '\\$0') + `'` :
                            key) +
                    ': ' + pseudoJson(value, sub, indentMultilineStrings);
              })
              .join(',\n' + sub) +
          '\n' + indent + '}';
    }
  }
}