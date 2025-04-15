import type { StorageConfig } from "lib/2.app/config/storage.contract";
import { createDriving } from "./5.di/driving.factory";
import { createDrivers } from "./5.di/drivers.factory";
import { createConfigHandlers } from "./5.di/config.factory";
import type { LoggingConfig } from "./2.app/config/log.contract";
import type { ImportMapConfig } from "./2.app/config/import-map.contract";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    config: LoggingConfig & StorageConfig & ImportMapConfig
) => {  
    const configHandlers = createConfigHandlers(config);
    const adapters = createDriving(configHandlers);
    const app = createDrivers(configHandlers, adapters);

    return app.getRemoteEntries(remotesOrManifestUrl)
        .then(app.saveRemoteEntries)
        .then(app.determineSharedExternals)
        .then(app.generateImportMap)
        .then(app.commitChanges)

}

export { initFederation };
