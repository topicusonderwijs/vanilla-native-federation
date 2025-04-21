import type { Logger } from "lib/2.app/config/log.contract";

const consoleLogger: Logger = ({
    /* eslint no-console: "off", curly: "error" */
    debug: (msg: string, err) => console.log(`[DEBUG]: ${msg}`, err),
    error: (msg: string, err) => console.error(`[NF]: ${msg}`, err),
    warn: (msg: string, err) => console.warn(`[NF]: ${msg}`, err),
})

export {consoleLogger}