import type { LogHandler } from "lib/2.app/handlers/log.contract";

const consoleLogger: LogHandler = ({
    /* eslint no-console: "off", curly: "error" */
    debug: (msg: string, err) => console.log(`[DEBUG]: ${msg}`, err),
    error: (msg: string, err) => console.error(`[NF]: ${msg}`, err),
    warn: (msg: string, err) => console.warn(`[NF]: ${msg}`, err),
})

export {consoleLogger}