import {addTabIndentSupport} from './editor/indent';
import {addUndoSupport} from './editor/undo';
import {defaultOptions, Options} from './options';
import {runTyper} from './typer';

type State = {
  content?: string,
  maxIterations?: number,
  autoRun?: boolean,
};

const defaultState: State = {
  content: `
function f(x, opts) {
  return opts && opts.mult ? x * 2 : x / 2;
}
    `.trim(),
  maxIterations: defaultOptions.maxIterations,
  autoRun: true,
};

function readStateFromFragment(): State {
  if (location.hash.length > 0) {
    try {
      return <State>JSON.parse(decodeURIComponent(location.hash.substring(1)));
    } catch (_) {
    }
  }
  return defaultState;
}

function saveStateToFragment(state: State) {
  location.hash = '#' + encodeURIComponent(JSON.stringify(state));
}

window.addEventListener('load', () => {
  const jsInput = <HTMLTextAreaElement>document.getElementById('input');
  const tsOutput = <HTMLTextAreaElement>document.getElementById('output');
  const button = <HTMLButtonElement>document.getElementById('run');
  const autoRunCheckBox = <HTMLInputElement>document.getElementById('autorun');
  const stats = <HTMLTextAreaElement>document.getElementById('stats');
  const maxIterations =
      <HTMLInputElement>document.getElementById('maxIterations');

  const initialState = readStateFromFragment();

  jsInput.value = 'content' in initialState ? initialState.content! : '';
  jsInput.addEventListener('input', (e) => {
    saveState();
    autoRun();
  });

  maxIterations.value = String(
      'maxIterations' in initialState ? initialState.maxIterations! :
                                        defaultState.maxIterations);
  maxIterations.addEventListener('input', () => {
    saveState();
    autoRun();
  });

  autoRunCheckBox.checked =
      'autoRun' in initialState ? initialState.autoRun! : true;
  autoRunCheckBox.addEventListener('change', () => {
    saveState();
    autoRun();
    updateRunVisibility();
  });

  const manager = addUndoSupport(jsInput, autoRun);
  addTabIndentSupport(jsInput, (c) => {
    manager.content = c;
    autoRun();
  });

  updateRunVisibility();
  autoRun();

  function saveState() {
    saveStateToFragment({
      content: jsInput.value,
      maxIterations: getMaxIterations(),
      autoRun: autoRunCheckBox.checked
    });
  }
  function autoRun() {
    if (autoRunCheckBox.checked) run();
  }
  function updateRunVisibility() {
    button.disabled = autoRunCheckBox.checked;
  }
  function getMaxIterations() {
    return Number.parseInt(maxIterations.value);
  }

  function run() {
    stats.textContent = `Analyzing...`;
    const start = new Date().getTime();

    const options = <Options>new Object(defaultOptions);
    options.debugPasses = true;
    options.maxIterations = getMaxIterations();

    const {outputs: {'file.ts': output}, metadata} =
        runTyper({'file.ts': jsInput.value})
    tsOutput.value = output;
    const time = new Date().getTime() - start;
    stats.textContent = `Execution time (${metadata.inferencePasses
                        } passes): ${time} milliseconds`;
  }
  button.onclick = run;
});
