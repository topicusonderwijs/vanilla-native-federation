

import type { ConfigContract, NFOptions } from "lib/2.app/config/config.contract";
import { createImportMapConfig } from "lib/4.config/import-map/import-map.config";
import { createHostConfig } from "lib/4.config/host/host.config";
import { createLogConfig } from "lib/4.config/logging/log.config";
import { createStorageConfig } from "lib/4.config/storage/storage.config";
import { createModeConfig } from "lib/4.config/mode/mode.config";

export const createConfigHandlers = (overrides: NFOptions): ConfigContract => ({
    ...createImportMapConfig(overrides),
    ...createHostConfig(overrides),
    ...createLogConfig(overrides),
    ...createStorageConfig(overrides),
    ...createModeConfig(overrides)
});