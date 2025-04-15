

import type { StorageConfig } from "lib/2.app/config/storage.contract";
import type { ConfigHandlers } from "lib/2.app/config/config.contract";
import type { LoggingConfig } from "lib/2.app/config/log.contract";
import { createLogHandler } from "lib/4.config/logging/log.handler";
import type { ImportMapConfig } from "lib/2.app/config/import-map.contract";
import { createImportMapConfig } from "lib/4.config/import-map/import-map.config";

export const createConfigHandlers = (cfg: LoggingConfig & StorageConfig & ImportMapConfig): ConfigHandlers => ({
    log: createLogHandler(cfg),
    storage: cfg.storage,
    importMap: createImportMapConfig(cfg)
});