import { DEFAULT_TITLE_SIGN } from './constants';
import { getRealLength } from './tool';

export * from 'log4js';

class AllContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private store: { [k: string]: Array<any>};
  constructor() {
    this.store = {};
  }
  get(key: string) {
    const values = this.store[key];
    return values && values.length > 0 ? values[values.length-1] : undefined;
  }
  addContext(key: string, value: any) {
    const values = this.store[key];
    if (values === undefined) {
      value.__deep = 1;
      this.store[key] = [value];
    } else {
      value.__deep = this.store[key].length + 1;
      this.store[key].push[value];
    }
    return (title: string) => this.formatTitle(key, title);
  }
  removeContext(key: string) {
    const contexts = this.store[key];
    if (contexts !== undefined) {
      if (contexts.length > 1) {
        contexts.pop();
      } else {
        delete this.store[key];
      }
    }
  }
  cleanContext() {
    this.store = {};
  }

  formatTitle(key: string, title: string) {
    const context = this.get(key);
    const len = getRealLength(title);
    const leftLen = 50 - Math.round(len/2) - context?.__deep || 0;
    const rightLen = 50 - Math.floor(len/2);
    return `${DEFAULT_TITLE_SIGN.repeat(leftLen)}${title}${DEFAULT_TITLE_SIGN.repeat(rightLen)}`;
  }
}

export const loggerContext = new AllContext();



