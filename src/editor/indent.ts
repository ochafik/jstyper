import {UndoManager} from './undo';

export function addTabIndentSupport(textArea: HTMLTextAreaElement, undoManager: UndoManager) {
  const tab = '  ';
  textArea.addEventListener('keydown', (e) => {
    if ((e.keyCode || e.which) == '\t'.charCodeAt(0)) {
        e.preventDefault();
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const text = textArea.value;
        if (start == end && !e.shiftKey) {
          textArea.value = text.substring(0, start) + tab + text.substring(end);
          textArea.selectionStart = start + tab.length;
          textArea.selectionEnd = textArea.selectionStart;
        } else {
          const selection = text.substring(start, end);
          let preTabIndex = text.lastIndexOf('\n', start);  
          if (preTabIndex < 0) preTabIndex = 0;
          else preTabIndex++;

          let skippedPreTabIndex = preTabIndex;
          let newSelection: string;
          let pre: string;
          if (e.shiftKey) {
            newSelection = selection.replace(new RegExp('\n' + tab, 'g'), '\n');
            const i = text.indexOf(tab, preTabIndex);
            if (text.indexOf(tab, preTabIndex) == preTabIndex) {
              skippedPreTabIndex = preTabIndex + tab.length;
            }
            pre = '';
          } else {
            newSelection = selection.replace(/\n/g, '\n' + tab);
            pre = tab;
          }
          if (preTabIndex == start) {
            textArea.value = pre + newSelection.substring(skippedPreTabIndex - preTabIndex) + text.substring(end);
          } else {
            textArea.value = text.substring(0, preTabIndex) + pre + text.substring(skippedPreTabIndex, start) + newSelection + text.substring(end);
          }
          const startOffset = pre.length + preTabIndex - skippedPreTabIndex;
          textArea.selectionStart = start + startOffset;
          textArea.selectionEnd = end + startOffset + newSelection.length - selection.length;
        }
        undoManager.content = textArea.value;
    }
  });
}