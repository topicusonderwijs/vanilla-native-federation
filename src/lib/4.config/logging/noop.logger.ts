import type { Logger } from "lib/2.app/config/log.contract";

const noopLogger: Logger = ({
    debug: () => {},
    error: () => {},
    warn: () => {},
})

export { noopLogger }