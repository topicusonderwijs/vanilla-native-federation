import type { LogHandler } from "./../../lib/handlers/logging";

const consoleLogger: LogHandler = ({
    /* eslint no-console: "off", curly: "error" */
    debug: (msg: string) => console.log(`[DEBUG]: ${msg}`),
    error: (msg: string) => console.error(`[NF]: ${msg}`),
    warn: (msg: string) => console.warn(`[NF]: ${msg}`),
})

export {consoleLogger}