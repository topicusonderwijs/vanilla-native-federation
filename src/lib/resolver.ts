import { domHandlerFactory } from "./dom/dom.handler";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { initFederationHandlerFactory } from "./init-federation/init-federation.handler";
import { logHandlerFactory, type LogType, type LogHandler } from "./logging/log.handler";
import { noopLogger } from "./logging/noop.logger";
import { remoteInfoHandlerFactory } from "./remote-entry/remote-info.handler";
import { sharedInfoHandlerFactory } from "./remote-entry/shared-info.handler";
import { remoteModuleHandlerFactory } from "./remote-module/remote-module.handler";
import { DEFAULT_STORAGE } from "./storage/default-storage";
import type { StorageExtension, NfStorage } from "./storage/storage.contract";
import { storageHandlerFactory } from "./storage/storage.handler";

type Config<TCache extends NfStorage = NfStorage> = {
    cache: TCache,
    logger: LogHandler,
    logLevel: LogType
}

const defaultConfig = (o: Partial<Config<NfStorage & StorageExtension>>): Config<NfStorage & StorageExtension> => {
    return {
        cache: o.cache ?? DEFAULT_STORAGE,
        logger: o.logger ?? noopLogger,
        logLevel: o.logLevel ?? "error"
    }
}

const resolver = <TCache extends NfStorage & StorageExtension>(
    {cache, logger, logLevel}: Config<TCache>
) => {
    // Base handlers
    const domHandler = domHandlerFactory();
    const storageHandler = storageHandlerFactory(cache);
    const logHandler = logHandlerFactory(logLevel, logger)

    // remote-entry
    const sharedInfoHandler = sharedInfoHandlerFactory(storageHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(storageHandler, logHandler, sharedInfoHandler);

    // import map
    const importMapHandler = importMapHandlerFactory(sharedInfoHandler);
    
    // remote-module
    const remoteModuleHandler = remoteModuleHandlerFactory(logHandler, remoteInfoHandler, domHandler);

    // Init federation
    const initFederationHandler = initFederationHandlerFactory(domHandler, logHandler, remoteInfoHandler, importMapHandler, remoteModuleHandler);

    return {
        domHandler,
        storageHandler, 
        logHandler, 
        sharedInfoHandler, 
        remoteInfoHandler, 
        importMapHandler, 
        remoteModuleHandler,
        initFederationHandler
    };
}

export {Config, defaultConfig, resolver};