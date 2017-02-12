
export function pseudoJson(
    obj: any, indent: string = '', indentMultilineStrings: boolean = false) {
  if (typeof obj == 'number' || typeof obj == 'boolean' || obj == null) {
    return `${obj}`;
  } else if (typeof obj == 'string') {
    let str = obj;
    if (obj.indexOf('\n') >= 0 && indentMultilineStrings) {
      const lineIndent = '\n' + indent;
      str = lineIndent + '  ' +
          obj.replace(new RegExp('\n', 'g'), lineIndent + '  ') + lineIndent;
    }
    return '`' + str.replace(/([$`])/g, '\\$1') + '`';
  } else {
    const sub = indent + '  ';
    if (obj instanceof Array) {
      if (obj.length == 0) {
        return '[]';
      }
      return '[\n' + indent +
          (obj as any[])
              .map(o => pseudoJson(o, sub, indentMultilineStrings))
              .join(',\n' + sub) +
          '\n' + indent + ']';
    } else {
      const keys = Object.keys(obj);
      if (keys.length == 0) {
        return '{}';
      }
      return '{\n' + sub +
          keys.map(key => {
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