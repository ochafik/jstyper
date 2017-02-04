import {runTyper} from './typer';

window.onload = () => {
  const jsInput = <HTMLTextAreaElement>document.getElementById('input');
  if (location.hash.length > 0) {
    jsInput.value = decodeURIComponent(location.hash.substring(1));
  }
  jsInput.oninput = () => {
    location.hash = '#' + encodeURIComponent(jsInput.value);
  };
  const tsOutput = <HTMLTextAreaElement>document.getElementById('output');
  const button = <HTMLButtonElement>document.getElementById('type');

  button.onclick = () => {
    const [[_, output]] = runTyper(new Map([['file.js', jsInput.value]]));
    tsOutput.value = output;
  };
};
