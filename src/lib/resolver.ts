import type { CacheExtension, NativeFederationCache } from "./cache/cache.contract";
import  { cacheHandlerFactory } from "./cache/cache.handler";
import { DEFAULT_CACHE } from "./cache/default-cache";
import { domHandlerFactory } from "./dom/dom.handler";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { logHandlerFactory, type LogType, type LogHandler } from "./logging/log.handler";
import { noopLogger } from "./logging/noop.logger";
import { remoteInfoHandlerFactory } from "./remote-entry/remote-info.handler";
import { sharedInfoHandlerFactory } from "./remote-entry/shared-info.handler";
import { remoteModuleHandlerFactory } from "./remote-module/remote-module.handler";

type Config<TCache extends NativeFederationCache = NativeFederationCache> = {
    cache: TCache,
    logger: LogHandler,
    logLevel: LogType
}

const defaultConfig = (o: Partial<Config<NativeFederationCache & CacheExtension>>): Config<NativeFederationCache & CacheExtension> => {
    return {
        cache: o.cache ?? DEFAULT_CACHE,
        logger: o.logger ?? noopLogger,
        logLevel: o.logLevel ?? "error"
    }
}

const resolver = <TCache extends NativeFederationCache & CacheExtension>(
    {cache, logger, logLevel}: Config<TCache>
) => {
    // Base handlers
    const domHandler = domHandlerFactory();
    const cacheHandler = cacheHandlerFactory(cache);
    const logHandler = logHandlerFactory(logLevel, logger)

    // remote-entry
    const sharedInfoHandler = sharedInfoHandlerFactory(cacheHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(cacheHandler, logHandler, sharedInfoHandler);

    // import map
    const importMapHandler = importMapHandlerFactory(sharedInfoHandler);
    
    // remote-module
    const remoteModuleHandler = remoteModuleHandlerFactory(logHandler, remoteInfoHandler, domHandler);

    return {
        domHandler,
        cacheHandler, 
        logHandler, 
        sharedInfoHandler, 
        remoteInfoHandler, 
        importMapHandler, 
        remoteModuleHandler
    };
}



export {Config, defaultConfig, resolver};