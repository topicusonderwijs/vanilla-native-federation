import type { Handlers } from "./handlers.contract";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { logHandlerFactory } from "./logging/log.handler";
import { remoteInfoHandlerFactory } from "./remote-info/remote-info.handler";
import { remoteModuleHandlerFactory } from "./remote-module/remote-module.handler";
import { sharedInfoHandlerFactory } from "./shared-info/shared-info.handler";
import type { StorageExtension, NfStorage } from "./storage/storage.contract";
import { storageHandlerFactory } from "./storage/storage.handler";
import type { Config } from "../utils/config/config.contract";

const resolveHandlers = <TCache extends NfStorage & StorageExtension>(
    {cache, logger, logLevel}: Config<TCache>,
): Handlers => {
    // Utils
    const storageHandler = storageHandlerFactory(cache);
    const logHandler = logHandlerFactory(logLevel, logger)

    // Core
    const sharedInfoHandler = sharedInfoHandlerFactory(storageHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(storageHandler, logHandler);

    const importMapHandler = importMapHandlerFactory(sharedInfoHandler);
    
    const remoteModuleHandler = remoteModuleHandlerFactory(logHandler, remoteInfoHandler, sharedInfoHandler);

    return {
        storageHandler,
        logHandler,
        sharedInfoHandler,
        remoteInfoHandler,
        importMapHandler,
        remoteModuleHandler
    }
}

export { resolveHandlers }
