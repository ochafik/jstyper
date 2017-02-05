import {runTyper} from './typer';
import {addTabIndentSupport} from './editor/indent';

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
  addTabIndentSupport(jsInput);
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
    const result = runTyper(new Map([['file.js', jsInput.value]]))
    const [[_, output]] = result;
    tsOutput.value = output;
    const time = new Date().getTime() - start;
    stats.textContent = `Took ${time} milliseconds`;
  }
  button.onclick = run;
};
