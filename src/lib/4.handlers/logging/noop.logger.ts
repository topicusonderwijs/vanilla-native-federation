import type { LogHandler } from "lib/2.app/handlers/log.contract";

const noopLogger: LogHandler = ({
    debug: () => {},
    error: () => {},
    warn: () => {},
})

export { noopLogger }