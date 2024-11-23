import type { LogHandler } from "./log.handler"

const consoleLogger: LogHandler = ({
    debug: (msg: string) => console.log(`[DEBUG]: ${msg}`),
    error: (msg: string) => console.error(`[NF]: ${msg}`),
    warn: (msg: string) => console.warn(`[NF]: ${msg}`),
})

export {consoleLogger}