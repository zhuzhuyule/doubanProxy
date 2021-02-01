import { DEFAULT_SIGN, LOG_CONTEXT_KEYS } from '@utils/constants';
import { getGlobalContext, LoggingEvent } from '@utils/logger';

const tokens = {
  [LOG_CONTEXT_KEYS.file]: (logEvent: { fileName: string, lineNumber: number }): string => {
    const file = logEvent.fileName.match(/(?<=[/\\])(?<name>[^/\\]+)(?=\.(?<extend>\w+)$)/);
    return file && `${file.groups?.name||''}` || ''
  },
  [LOG_CONTEXT_KEYS.operate]: (logEvent: LoggingEvent): string => {
    const operateValue = logEvent.context[LOG_CONTEXT_KEYS.operate] === undefined ? getGlobalContext(LOG_CONTEXT_KEYS.operate) : logEvent.context[LOG_CONTEXT_KEYS.operate];
    if (operateValue) {
      return `${DEFAULT_SIGN.repeat(operateValue.__deep || 0)} ${operateValue.prefix || ''}`;
    }
    return '';
  }
}

const layoutPattern = {
  console: `[%d{MM-dd hh:mm:ss.SSS}] [%11.-11x{${LOG_CONTEXT_KEYS.file}}:%-3l] %[[%-5.5p]: %x{${LOG_CONTEXT_KEYS.operate}}%m%]`,
  common: `[%d{MM-dd hh:mm:ss.SSS}] [%11.-11x{${LOG_CONTEXT_KEYS.file}}:%-3l] [%-5.5p]: %x{${LOG_CONTEXT_KEYS.operate}}%m`,
}

const baseLayout = {
  type: 'pattern',
  pattern: layoutPattern.common,
  tokens,
}

const baseConfig = {
    appenders: {
      console: {
        type: 'console',
        layout: {
          ...baseLayout,
          pattern: layoutPattern.console,
        },
      },
      test: {
        type: 'file',
        filename: './log/test',
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        keepFileExt: true,
        layout: baseLayout,
        daysToKeep: 7,
        maxLogSize: 1024 * 1024 * 5,
      },
      everything: {
        type: 'DateFile',
        filename: './log/everything',
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: baseLayout,
        daysToKeep: 7,
        maxLogSize: 1024 * 1024 * 5,
      },
      db: {
        type: 'DateFile',
        filename: './log/db',
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: baseLayout,
        daysToKeep: 7,
        maxLogSize: 1024 * 1024 * 5,
      },
      api: {
        type: 'DateFile',
        filename: './log/api',
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: baseLayout,
        daysToKeep: 7,
        maxLogSize: 1024 * 1024 * 5,
      },
    },
    categories: {
      default: {
        appenders: ['console', 'everything'],
        level: 'info',
        enableCallStack: true,
      },
      test: {
        appenders: ['console', 'test'],
        level: 'trace',
        enableCallStack: true,
      },
      db: {
        appenders: ['console', 'everything', 'db'],
        level: 'info',
        enableCallStack: true,
      },
      api: {
        appenders: ['console', 'everything', 'api'],
        level: 'trace',
        enableCallStack: true,
      },
    },
}

export const log4jsConfig = {
  server: baseConfig,
  test: {
    appenders: baseConfig.appenders,
    categories: {
      default: baseConfig.categories.test,
    }
  }
};
