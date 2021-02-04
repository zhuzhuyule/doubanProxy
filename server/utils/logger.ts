/* eslint-disable no-unused-vars */
import operateCtrl from '@controllers/operate';
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
    if (typeof value === 'object') {
      const values = this.store[key];
      if (values === undefined) {
        value.__deep = 1;
        this.store[key] = [value];
      } else {
        value.__deep = this.store[key].length + 1;
        this.store[key].push[value];
      }
    } else {
      this.store[key] = [value];
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
  cleanContext(contextKey?: string) {
    if (contextKey) {
      this.store[contextKey] = [];
    } else {
      this.store = {};
    }
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
  addGlobalContext: (title?: string, contextKey?: string, contextValue?: unknown) => void;
  removeGlobalContext: (endMsg?: string, contextKey?: string) => void;
  clearGlobalContext: () => void;
  execOperate: (title: string | undefined, endMsg: string | undefined, options: { operate: string, args: Array<string|number> }, next: () => Promise<unknown>) => Promise<void>;
  initialOperate: (operateName: string) => Promise<Array<number|string>>;
} & Logger;

const getLogger = (category?: string): NewLogger => {
  const logger = getLogger4js(category);
  const _error = logger.error;

  Object.defineProperties(logger, {
    // error: {
    //   value: (...args) => {
    //     _error(logSymbol.error, ...args);
    //   }
    // },
    addGlobalContext: {
      value: (title = '', contextKey = LOG_CONTEXT_KEYS.operate, contextValue = {}) => {
        const formatTitle = globalContext.addContext(contextKey, contextValue);
        title && logger.trace(formatTitle(title));
      },
    },
    removeGlobalContext: {
      value: (endMsg = '', contextKey = LOG_CONTEXT_KEYS.operate) => {
        endMsg && logger.trace(`[END]${logSymbol.info}`, endMsg);
        globalContext.removeContext(contextKey)
      },
    },
    clearGlobalContext: {
      value: globalContext.cleanContext,
    },
    execOperate: {
      value: async (title = '', endMsg = '', options: { operate: string, args: Array<string|number> }, next: () => Promise<unknown>) => {
        globalContext.addContext(options.operate, title)
        const formatTitle = globalContext.addContext(LOG_CONTEXT_KEYS.operate, options);
        logger.trace(title && formatTitle(title));
        if (options.operate && options.args) {
          await operateCtrl.update(options.operate, options.args)
          .catch(e => {
            logger.error(`Update ${options.operate} args [${options.args}] failed!`, e);
          });
        } else {
          logger.error(`Invalid context value: ${JSON.stringify(options)}`);
        }
        let isSuccess = true;
        try {
          await next();
        } catch (error) {
          logger.error(`Find some error: `, error);
          isSuccess = false;
        } finally  {
          logger.trace(`[END]${logSymbol.info}`, endMsg);
          globalContext.removeContext(LOG_CONTEXT_KEYS.operate)
          if ( options.operate && options.args) {
            await operateCtrl.update(options.operate, options.args, isSuccess)
            .catch(e => {
              logger.error(`Update ${options.operate} args [${options.args}] failed!`, e);
            });
          } else {
            logger.error(`Invalid context value: ${JSON.stringify(options)}`);
          }
        }
      },
    },
    initialOperate: {
      value: async (operateName: string) => {
        globalContext.cleanContext(operateName);
        globalContext.addContext(operateName, `Start ${operateName}`)
        const operate = await operateCtrl.findLatestOne(operateName);
        return operate?.args || [];
      },
    },
  })
  return logger as NewLogger;
}

const getGlobalContext = (contextKey: string): unknown => globalContext.get(contextKey);

export {
  getLogger,
  getGlobalContext,
}



