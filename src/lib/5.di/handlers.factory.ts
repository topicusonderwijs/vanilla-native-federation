

import type { StorageConfig } from "lib/2.app/handlers/storage.contract";
import type { HandlersContract } from "lib/2.app/handlers/handlers.contract";
import type { LoggingConfig } from "lib/2.app/handlers/log.contract";
import { createLogHandler } from "lib/4.handlers/logging/log.handler";
import { createPathHandler } from "lib/4.handlers/path/path.handler";
import type { ImportMapConfig } from "lib/2.app/handlers/import-map.contract";
import { createImportMapHandler } from "lib/4.handlers/import-map/import-map.handler";

export const createHandlers = (cfg: LoggingConfig & StorageConfig & ImportMapConfig): HandlersContract => ({
    log: createLogHandler(cfg),
    storage: cfg.storage,
    path: createPathHandler(),
    importMap: createImportMapHandler(cfg)
})