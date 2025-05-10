import type { Logger } from "lib/2.app/config/log.contract";

const consoleLogger: Logger = ({
    /* eslint no-console: "off", curly: "error" */
    debug: (msg: string, err) => (!!err) ? console.log(`[DEBUG]: ${msg}`, err) : console.log(`[DEBUG]: ${msg}`),
    error: (msg: string, err) => (!!err) ? console.error(`[NF]: ${msg}`, err) : console.error(`[NF]: ${msg}`),
    warn: (msg: string, err) => (!!err) ? console.warn(`[NF]: ${msg}`, err) : console.warn(`[NF]: ${msg}`),
})

export {consoleLogger}