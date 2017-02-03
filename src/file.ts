import * as ts from "typescript";

export type VersionedFile = Readonly<{
  version: number,
  content: string,
  originalContent: string,
  patchHistory: ReadonlyArray<ReadonlyArray<ts.TextChange>>,
}>;

export function makeVersionedFile(content: string): VersionedFile {
  return {
    version: 0,
    content: content,
    originalContent: content,
    patchHistory: []
  };
}

export function updateVersionedFile(file: VersionedFile, changes: ts.TextChange[]): VersionedFile {
  const inverseSortedChanges = [...changes].sort((a, b) => b.span.start - a.span.start);
  let content = file.content;
  for (const change of inverseSortedChanges) {
    content = content.slice(0, change.span.start) + change.newText + content.slice(change.span.start + change.span.length)
  }
  return {
    version: file.version + 1,
    content: content,
    originalContent: file.originalContent,
    patchHistory: [...file.patchHistory, inverseSortedChanges]
  };
}
