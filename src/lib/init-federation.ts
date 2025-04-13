import type { LoggingConfig } from "lib/3.adapters/logging/logging.contract";
import type { StorageConfig } from "lib/3.adapters/storage/storage.contract";
import { createDriving } from "./4.di/driving.factory";
import { createDrivers } from "./4.di/drivers.factory";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    config: LoggingConfig & StorageConfig
) => {   
    const driving = createDriving(config);
    const app = createDrivers(driving);

    return app.getRemoteEntries(remotesOrManifestUrl)
        .then(app.saveRemoteEntries)
        .then(app.determineSharedExternals)
}

export { initFederation };
