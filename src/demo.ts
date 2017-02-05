import {runTyper} from './typer';
import {Options, defaultOptions} from './options';
import {addTabIndentSupport} from './editor/indent';
import {addUndoSupport} from './editor/undo';

window.addEventListener('load', () => {
  const jsInput = <HTMLTextAreaElement>document.getElementById('input');
  const tsOutput = <HTMLTextAreaElement>document.getElementById('output');
  const button = <HTMLButtonElement>document.getElementById('run');
  const autoRunCheckBox = <HTMLInputElement>document.getElementById('autorun');
  const stats = <HTMLTextAreaElement>document.getElementById('stats');
  const maxIterations = <HTMLInputElement>document.getElementById('maxIterations');

  if (location.hash.length > 0) {
    jsInput.value = decodeURIComponent(location.hash.substring(1));
  } else {
    jsInput.value = `
function f(x, opts) {
  return opts && opts.mult ? x * 2 : x / 2;
}
    `.trim();
  }
  jsInput.addEventListener('input', (e) => {
    location.hash = '#' + encodeURIComponent(jsInput.value);
    autoRun();
  });

  maxIterations.value = '' + defaultOptions.maxIterations;
  maxIterations.addEventListener('input', autoRun);
  
  const manager = addUndoSupport(jsInput, autoRun);
  addTabIndentSupport(jsInput, (c) => {
    manager.content = c;
    autoRun();
  });
  updateRunVisibility();
  autoRunCheckBox.addEventListener('change', () => {
    autoRun();
    updateRunVisibility();
  });
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

    const options = <Options>new Object(defaultOptions);
    options.debugPasses = true;
    options.maxIterations = Number.parseInt(maxIterations.value);

    const {fileContents: [[_, output]], inferencePasses} = runTyper(new Map([['file.js', jsInput.value]]))
    tsOutput.value = output;
    const time = new Date().getTime() - start;
    stats.textContent = `Execution time (${inferencePasses} passes): ${time} milliseconds`;
  }
  button.onclick = run;
});
