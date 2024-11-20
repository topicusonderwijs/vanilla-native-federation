import type { LogHandler } from "./log.handler"

const NoopLogger: LogHandler = ({
    debug: (_: string) => {},
    error: (_: string) => {},
    warn: (_: string) => {},
})

export { NoopLogger}