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
    const oldContent = this.content;
    const newContent = applyTextChanges(oldContent, changes);
    this.content = newContent;
    return newContent != oldContent;
  }

  get content() {
    return this._content;
  }

  set content(newContent: string) {
    if (this._content == newContent) {
      return;
    }
    this._version++;
    this._content = newContent;
  }
}

function applyTextChanges(
    initialContent: string, changes: ts.TextChange[]): string {
  const inverseSortedChanges =
      [...changes].sort((a, b) => b.span.start - a.span.start);
  let content = initialContent;
  // let lastIndex: number | undefined;
  let lastChange: ts.TextChange | undefined;
  for (const change of inverseSortedChanges) {
    if (lastChange && change.span.start === lastChange.span.start) {
      console.warn(`Concurrent changes: ${JSON.stringify(lastChange)} vs. ${JSON.stringify(change)}`);
      // throw new Error(`Concurrent changes at index ${lastIndex}`);
      continue;
    }
    content = content.slice(0, change.span.start) + change.newText +
        content.slice(change.span.start + change.span.length);

    lastChange = change;
    // console.warn(`Applied change ${JSON.stringify(change)}:\n${content}`);
  }
  return content;
}
