import type { LogHandler } from "lib/2.app/config/log.contract";

const noopLogger: LogHandler = ({
    debug: () => {},
    error: () => {},
    warn: () => {},
})

export { noopLogger }