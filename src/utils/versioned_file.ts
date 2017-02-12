import * as ts from 'typescript';

export class VersionedFile {
  private _version: number = 0;
  private _content: string;

  constructor(public readonly originalContent: string) {
    this._content = originalContent;
  }

  get version() {
    return this._version;
  }

  commitChanges(changes: ts.TextChange[]): boolean {
    this._version++;
    const oldContent = this._content;
    const newContent = applyTextChanges(oldContent, changes);
    this._content = newContent;
    return newContent != oldContent;
  }

  get content() {
    return this._content;
  }
}

function applyTextChanges(
    initialContent: string, changes: ts.TextChange[]): string {
  const inverseSortedChanges =
      [...changes].sort((a, b) => b.span.start - a.span.start);
  let content = initialContent;
  for (const change of inverseSortedChanges) {
    content = content.slice(0, change.span.start) + change.newText +
        content.slice(change.span.start + change.span.length);
    // console.warn(`Applied change ${JSON.stringify(change)}:\n${content}`);
  }
  return content;
}
