import type { Config } from "../utils";
import { exposedModuleHandlerFactory } from "./exposed-module/exposed-module.handler";
import type { Handlers } from "./handlers.contract";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { logHandlerFactory } from "./logging/log.handler";
import { remoteInfoHandlerFactory } from "./remote-info/remote-info.handler";
import { sharedInfoHandlerFactory } from "./shared-info/shared-info.handler";
import type { NfCache } from "./storage/storage.contract";
import { storageHandlerFactory } from "./storage/storage.handler";

const resolveHandlers = <TCache extends NfCache>(
    {storage, cache, logger, logLevel}: Config<TCache>,
): Handlers => {
    // Utils
    const storageHandler = storageHandlerFactory(cache, storage);
    const logHandler = logHandlerFactory(logLevel, logger)

    // Core
    const sharedInfoHandler = sharedInfoHandlerFactory(storageHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(storageHandler, sharedInfoHandler);

    const importMapHandler = importMapHandlerFactory(sharedInfoHandler);

    const exposedModuleHandler = exposedModuleHandlerFactory();

    return {
        storageHandler,
        logHandler,
        sharedInfoHandler,
        remoteInfoHandler,
        importMapHandler,
        exposedModuleHandler
    }
}

export { resolveHandlers }
