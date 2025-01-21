import type { LogHandler, LogType } from "../../handlers/logging/log.contract"
import type { NfStorage } from "../../handlers/storage/storage.contract"

type Config<TCache extends NfStorage = NfStorage> = {
    cache: TCache,
    logger: LogHandler,
    logLevel: LogType
}

export { Config }