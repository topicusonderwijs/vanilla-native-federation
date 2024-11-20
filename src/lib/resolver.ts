import type { CacheExtension, NativeFederationCache } from "./cache/cache.contract";
import  { cacheHandlerFactory } from "./cache/cache.handler";
import { DEFAULT_CACHE } from "./cache/default-cache";
import { domHandlerFactory } from "./dom/dom.handler";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { logHandlerFactory, type LogType, type LogHandler } from "./logging/log.handler";
import { NoopLogger } from "./logging/noop.logger";
import { remoteInfoHandlerFactory } from "./remote-entry/remote-info.handler";
import { sharedInfoHandlerFactory } from "./remote-entry/shared-info.handler";

type Config<TCache extends NativeFederationCache = NativeFederationCache> = {
    cache: TCache,
    logger: LogHandler,
    logLevel: LogType
}

const defaultConfig = (o: Partial<Config<NativeFederationCache & CacheExtension>>): Config<NativeFederationCache & CacheExtension> => {
    return {
        cache: o.cache ?? DEFAULT_CACHE,
        logger: o.logger ?? NoopLogger,
        logLevel: "error"
    }
}

const resolver = <TCache extends NativeFederationCache & CacheExtension>(
    {cache, logger, logLevel}: Config<TCache>
) => {
    const cacheHandler = cacheHandlerFactory(cache);
    const logHandler = logHandlerFactory(logLevel, logger)
    const sharedInfoHandler = sharedInfoHandlerFactory(cacheHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(cacheHandler, sharedInfoHandler);
    const importMapHandler = importMapHandlerFactory(sharedInfoHandler);
    const domHandler = domHandlerFactory()
    return {cacheHandler, logHandler, sharedInfoHandler, remoteInfoHandler, importMapHandler, domHandler};
}

export {resolver, Config, defaultConfig};