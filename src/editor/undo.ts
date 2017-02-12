export function addUndoSupport(
    textArea: HTMLTextAreaElement,
    contentChanged: (content: string) => void): UndoManager {
  const manager = new UndoManager(textArea.value);
  textArea.addEventListener('input', (e) => {
    manager.content = textArea.value;
  });
  textArea.addEventListener('keydown', (e) => {
    // console.log(`KEYDOWN e.charCode = ${e.charCode}, ${e.keyCode} (e.metaKey
    // = ${e.metaKey}, e.ctrlKey = ${e.ctrlKey})`);
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 90) {
      e.preventDefault();
      if (e.shiftKey) {
        manager.redo();
      } else {
        manager.undo();
      }
      textArea.value = manager.content;
      contentChanged(textArea.value);
    }
  });
  return manager;
}

type Edit = {
  offset: number,
  previousText: string,
  nextText: string,
};

export class UndoManager {
  private edits: Edit[] = [];
  private editIndex: number = 0;

  constructor(private _content = '') {}

  get content() {
    return this._content;
  }
  set content(newContent: string) {
    if (newContent == this._content) return;
    this.addEdit(inferDiff(this._content, newContent));
  }
  addEdit(edit: Edit) {
    // console.log(`EDIT: ${JSON.stringify(edit, null, 2)}`);
    this.applyEdit(edit);
    this.edits.splice(this.editIndex, this.edits.length - this.editIndex, edit);
    this.editIndex++;
  }
  undo() {
    if (this.editIndex == 0) return;

    const edit = this.edits[--this.editIndex];
    // console.log(`UNDO: original edit: ${JSON.stringify(edit, null, 2)}`);
    this.applyEdit(invertEdit(edit));
  }
  redo() {
    if (this.editIndex == this.edits.length) return;

    const edit = this.edits[this.editIndex++];
    this.applyEdit(edit);
  }

  applyEdit(edit: Edit) {
    // console.log(`APPLYING EDIT: ${JSON.stringify(edit, null, 2)}`);
    this._content = this._content.substring(0, edit.offset) + edit.nextText +
        this._content.substring(edit.offset + edit.previousText.length);
  }
}

function invertEdit(diff: Edit) {
  return {
    offset: diff.offset, previousText: diff.nextText,
        nextText: diff.previousText
  }
}
function inferDiff(a: string, b: string): Edit {
  let diffStart = 0;
  let diffEnd = a.length;
  for (let i = 0, n = a.length; i < n; i++) {
    if (a[i] == b[i]) {
      diffStart = i + 1;
    } else {
      break;
    }
  }
  for (let i = a.length - 1, j = b.length - 1;
       i >= 0 && i >= diffStart && j >= 0; i--, j--) {
    if (a[i] == b[j]) {
      diffEnd = i;
    } else {
      break;
    }
  }
  return {
    offset: diffStart,
    previousText: a.substring(diffStart, diffEnd),
    nextText: b.substring(diffStart, b.length - (a.length - diffEnd))
  };
}