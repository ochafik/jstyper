import {runTyper} from './typer';

window.onload = () => {
  const jsInput = <HTMLTextAreaElement>document.getElementById('input');
  const tsOutput = <HTMLTextAreaElement>document.getElementById('output');
  const button = <HTMLButtonElement>document.getElementById('run');
  const autoRunCheckBox = <HTMLInputElement>document.getElementById('autorun');
  const stats = <HTMLTextAreaElement>document.getElementById('stats');

  if (location.hash.length > 0) {
    jsInput.value = decodeURIComponent(location.hash.substring(1));
  } else {
    jsInput.value = `
function f(x, opts) {
  return opts && opts.mult ? x * 2 : x / 2;
}
    `.trim();
  }
  jsInput.oninput = () => {
    location.hash = '#' + encodeURIComponent(jsInput.value);
    autoRun();
  };
  addTabSupport(jsInput);
  updateRunVisibility();
  autoRunCheckBox.onchange = () => {
    autoRun();
    updateRunVisibility();
  }
  autoRun();

  function autoRun() {
    if (autoRunCheckBox.checked) run();
  }
  function updateRunVisibility() {
    button.disabled = autoRunCheckBox.checked;
  }

  function run() {
    stats.textContent = `Analyzing...`;
    const start = new Date().getTime();
    const [[_, output]] = runTyper(new Map([['file.js', jsInput.value]]));
    tsOutput.value = output;
    const time = new Date().getTime() - start;
    stats.textContent = `Took ${time} milliseconds`;
  }
  button.onclick = run;
};

function addTabSupport(textArea: HTMLTextAreaElement) {
  const tab = '  ';
  textArea.onkeydown = (e) => {
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
          textArea.value = text.substring(0, preTabIndex) + pre + text.substring(skippedPreTabIndex, start) + newSelection + text.substring(end);
          const startOffset = pre.length + preTabIndex - skippedPreTabIndex;
          textArea.selectionStart = start + startOffset;
          textArea.selectionEnd = end + startOffset + newSelection.length - selection.length;
        }
    }
  };
}