import type { LogHandler } from "./log.handler"

const noopLogger: LogHandler = ({
    debug: (_: string) => {},
    error: (_: string) => {},
    warn: (_: string) => {},
})

export { noopLogger }