

import type { StorageConfig } from "lib/2.app/handlers/storage.contract";
import type { HandlersContract } from "lib/2.app/handlers/handlers.contract";
import type { LoggingConfig } from "lib/2.app/handlers/log.contract";
import { createLogHandler } from "lib/4.handlers/logging/log.handler";
import { createPathHandler } from "lib/4.handlers/path/path.handler";

export const createHandlers = (cfg: LoggingConfig & StorageConfig): HandlersContract => ({
    log: createLogHandler(cfg),
    storage: cfg.storage,
    path: createPathHandler()
})