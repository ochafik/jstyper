import * as ts from 'typescript';

import {VersionedFile} from './versioned_file';

export type AddChangeCallback = (fileName: string, change: ts.TextChange) =>
    void;
export type ReactorCallback =
    (fileNames: string[], services: ts.LanguageService,
     addChange: AddChangeCallback) => void;

export class LanguageServiceReactor implements ts.LanguageServiceHost {
  private files = new Map<string, VersionedFile>();
  private services: ts.LanguageService;
  private fileNames: string[];

  constructor(
      fileContents: {[fileName: string]: string},
      private currentWorkingDir = '.', private options: ts.CompilerOptions) {
    const fileNames: string[] = [];
    for (const fileName in fileContents) {
      const content = fileContents[fileName];
      this.files.set(fileName, new VersionedFile(content));
      fileNames.push(fileName);
    }
    this.services = ts.createLanguageService(this, ts.createDocumentRegistry());
    this.fileNames = fileNames;
  }

  getScriptFileNames() {
    return this.fileNames;
  }
  getScriptVersion(fileName) {
    const file = this.files.get(fileName);
    if (file == null) return '';
    return file.version.toString();
  }
  getScriptSnapshot(fileName) {
    const file = this.files.get(fileName);
    return file && ts.ScriptSnapshot.fromString(file.content);
  }
  getCurrentDirectory() {
    return this.currentWorkingDir;
  }
  getCompilationSettings() {
    return this.options;
  }
  getDefaultLibFileName(options) {
    try {
      const result = ts.getDefaultLibFilePath(this.options);
      return result;
    } catch (e) {
      return 'index.ts';
    }
  }

  get fileContents(): {[fileName: string]: string} {
    const result = Object.create(null);
    for (const [fileName, file] of this.files) {
      result[fileName] = file.content;
    }
    return result;
  }

  react(callback: ReactorCallback): boolean {
    const pendingChanges = new Map<string, ts.TextChange[]>();

    callback(this.fileNames, this.services, (fileName, change) => {
      const changes = pendingChanges.get(fileName);
      if (changes) {
        changes.push(change);
      } else {
        pendingChanges.set(fileName, [change]);
      }
    });

    if (pendingChanges.size == 0) {
      return false;
    }

    let changed = false;
    for (const [fileName, changes] of pendingChanges) {
      if (this.files.get(fileName)!.commitChanges(changes)) {
        changed = true;
      }
    }
    return changed;
  }
}
