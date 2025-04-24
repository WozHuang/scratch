import log4js from 'log4js';

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'debug' } }
});

export const getLogger: typeof log4js.getLogger = log4js.getLogger.bind(log4js);
