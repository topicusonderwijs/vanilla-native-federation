import type { LogHandler } from "./logging.contract"

const noopLogger: LogHandler = ({
    debug: (_: string) => {},
    error: (_: string) => {},
    warn: (_: string) => {},
})

export { noopLogger }