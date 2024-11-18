import type { CacheExtension, NativeFederationCache } from "./cache/cache.contract";
import  { cacheHandlerFactory } from "./cache/cache.handler";
import { DEFAULT_CACHE } from "./cache/default-cache";
import { domHandlerFactory } from "./dom/dom.handler";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { remoteInfoHandlerFactory } from "./remote-entry/remote-info.handler";
import { sharedInfoHandlerFactory } from "./remote-entry/shared-info.handler";

type Config<TCache extends NativeFederationCache = NativeFederationCache> = {
    cache: TCache
}

const defaultConfig = (o: Partial<Config<NativeFederationCache & CacheExtension>>): Config<NativeFederationCache & CacheExtension> => {
    return {
        cache: o.cache ?? DEFAULT_CACHE
    }
}

const resolver = <TCache extends NativeFederationCache & CacheExtension>(
    {cache}: Config<TCache>
) => {
    const cacheHandler = cacheHandlerFactory(cache);
    const sharedInfoHandler = sharedInfoHandlerFactory(cacheHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(cacheHandler, sharedInfoHandler);
    const importMapHandler = importMapHandlerFactory(sharedInfoHandler);
    const domHandler = domHandlerFactory()
    return {cacheHandler, sharedInfoHandler, remoteInfoHandler, importMapHandler, domHandler};
}

export {resolver, Config, defaultConfig};