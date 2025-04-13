import type { StorageConfig } from "lib/2.app/handlers/storage.contract";
import { createDriving } from "./5.di/driving.factory";
import { createDrivers } from "./5.di/drivers.factory";
import { createHandlers } from "./5.di/handlers.factory";
import type { LoggingConfig } from "./2.app/handlers/log.contract";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    config: LoggingConfig & StorageConfig
) => {  
    const handlers = createHandlers(config);
    const adapters = createDriving(handlers);
    const app = createDrivers(handlers, adapters);

    return app.getRemoteEntries(remotesOrManifestUrl)
        .then(app.saveRemoteEntries)
        .then(app.determineSharedExternals)
}

export { initFederation };
