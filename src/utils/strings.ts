
export function deindent(src: string) {
  src = src.replace(/\t/g, '  ');
  const match = /^[ \t]*\n( +)([\s\S]*)$/m.exec(src);
  if (match) {
    const indent = match[1];
    src = match[2];
    const result = src.replace(new RegExp(`^${indent}`, 'gm'), '');
    return result;
  }
  return src;
}
