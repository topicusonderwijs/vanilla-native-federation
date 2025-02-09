import type { Config } from "../utils";
import { exposedModuleHandlerFactory } from "./exposed-module/exposed-module.handler";
import { externalsHandlerFactory } from "./externals/externals.handler";
import type { Handlers } from "./handlers.contract";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { logHandlerFactory } from "./logging/log.handler";
import { remoteInfoHandlerFactory } from "./remote-info/remote-info.handler";
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
    const externalsHandler = externalsHandlerFactory(config, storageHandler, versionHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(storageHandler, externalsHandler);

    const importMapHandler = importMapHandlerFactory(externalsHandler);

    const exposedModuleHandler = exposedModuleHandlerFactory();

    return {
        storageHandler,
        logHandler,
        externalsHandler,
        remoteInfoHandler,
        importMapHandler,
        exposedModuleHandler
    }
}

export { resolveHandlers }
