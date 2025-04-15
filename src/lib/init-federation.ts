import { createDriving } from "./5.di/driving.factory";
import { createDrivers } from "./5.di/drivers.factory";
import { createConfigHandlers } from "./5.di/config.factory";
import type { Options } from "./2.app/config/config.contract";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    config: Options
) => {  
    const configHandlers = createConfigHandlers(config);
    const adapters = createDriving(configHandlers);
    const app = createDrivers(configHandlers, adapters);

    return app.getRemoteEntries(remotesOrManifestUrl)
        .then(app.saveRemoteEntries)
        .then(app.determineSharedExternals)
        .then(app.generateImportMap)
        .then(app.commitChanges)
        .then(app.exposeModuleLoader)

}

export { initFederation };
