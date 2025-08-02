import type { Logger } from 'lib/2.app/config/log.contract';

const consoleLogger: Logger = {
  /* eslint no-console: "off", curly: "error" */
  debug: (step: number, msg: string, err) =>
    !!err ? console.log(`[DEBUG][${step}]: ${msg}`, err) : console.log(`[DEBUG][${step}]: ${msg}`),
  error: (step: number, msg: string, err) =>
    !!err ? console.error(`[NF][${step}]: ${msg}`, err) : console.error(`[NF][${step}]: ${msg}`),
  warn: (step: number, msg: string, err) =>
    !!err ? console.warn(`[NF][${step}]: ${msg}`, err) : console.warn(`[NF][${step}]: ${msg}`),
};

export { consoleLogger };
