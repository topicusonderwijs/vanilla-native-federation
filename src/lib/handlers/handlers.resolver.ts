import type { Config } from "../utils";
import { externalsHandlerFactory } from "./externals/externals.handler";
import type { Handlers } from "./handlers.contract";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { logHandlerFactory } from "./logging/log.handler";
import { remoteInfoHandlerFactory } from "./remote-info/remote-info.handler";
import { remoteModuleHandlerFactory } from "./remote-module/remote-module.handler";
import type { NfCache } from "./storage/storage.contract";
import { storageHandlerFactory } from "./storage/storage.handler";
import { versionHandlerFactory } from "./version/version.handler";

const resolveHandlers = <TCache extends NfCache>(
    config: Config<TCache>,
): Handlers => {
    // Utils
    const storageHandler = storageHandlerFactory(config);
    const logHandler = logHandlerFactory(config)

    // Core
    const versionHandler = versionHandlerFactory();
    const externalsHandler = externalsHandlerFactory(storageHandler, logHandler, versionHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(storageHandler);
    const remoteModuleHandler = remoteModuleHandlerFactory(config, storageHandler);

    const importMapHandler = importMapHandlerFactory(config, externalsHandler, remoteInfoHandler);

    return {
        storageHandler,
        logHandler,
        externalsHandler,
        remoteInfoHandler,
        remoteModuleHandler,
        importMapHandler
    }
}

export { resolveHandlers }
