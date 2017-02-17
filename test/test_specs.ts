import * as fs from 'fs';
import {typerTest} from '../src/testing/support';

describe('Typer', () => {
  const specsDir = 'test/specs';
  for (const file of fs.readdirSync(specsDir).filter(n => n.endsWith('.ts'))) {
    it(file, typerTest(`${specsDir}/${file}`));
  }
});
