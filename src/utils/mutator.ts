import {AddChangeCallback} from './language_service_reactor';

export class Mutator {
  constructor(private fileName: string, private addChange: AddChangeCallback) {}

  insert(start: number, newText: string) {
    this.addChange(
        this.fileName, {span: {start: start, length: 0}, newText: newText});
  }

  remove(start: number, end: number, newText: string = '') {
    this.addChange(
        this.fileName,
        {span: {start: start, length: end - start}, newText: newText});
  }
}