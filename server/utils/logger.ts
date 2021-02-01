import logSymbol from 'log-symbols';
import { getLogger as getLogger4js, Logger } from 'log4js';
import { DEFAULT_TITLE_SIGN, LOG_CONTEXT_KEYS } from './constants';
import { getRealLength } from './tool';

export * from 'log4js';

class GlobalContext {
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

  formatTitle(key: string, title: string, sign = DEFAULT_TITLE_SIGN) {
    const context = this.get(key);
    const len = getRealLength(title);
    const leftLen = 50 - Math.round(len/2) - context?.__deep || 0;
    const rightLen = 50 - Math.floor(len/2);
    return `${sign.repeat(leftLen)}${title}${sign.repeat(rightLen)}`;
  }
}

const globalContext = new GlobalContext();

type NewLogger = {
  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-explicit-any
  addGlobalContext: (title?: string, contextKey?: string, contextValue?: any) => void;
  // eslint-disable-next-line no-unused-vars
  removeGlobalContext: (endMsg?: string, contextKey?: string) => void;
  clearGlobalContext: () => void;
} & Logger;

const getLogger = (category?: string): NewLogger => {
  const logger = getLogger4js(category);

  Object.defineProperties(logger, {
    addGlobalContext: {
      value: (title = '', contextKey = LOG_CONTEXT_KEYS.operate, contextValue = {}) => {
        const formatTitle = globalContext.addContext(contextKey, contextValue);
        logger.trace(title && formatTitle(title));
      },
    },
    removeGlobalContext: {
      value: (endMsg = '', contextKey = LOG_CONTEXT_KEYS.operate) => {
        logger.trace(`[END]${logSymbol.info}`, endMsg);
        globalContext.removeContext(contextKey)
      },
    },
    clearGlobalContext: {
      value: globalContext.cleanContext,
    },
  })

  return logger as NewLogger;
}

const getGlobalContext = (contextKey: string): unknown => globalContext.get(contextKey);


export {
  getLogger,
  getGlobalContext,
}



