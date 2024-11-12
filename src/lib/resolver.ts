import type { NativeFederationCache } from "./cache/cache.contract";
import  { type TCacheHandler, cacheHandlerFactory } from "./cache/cache.handler";
import { dependencyHandlerFactory } from "./dependency/dependency.handler";
import type { DiscoveryCache } from "./discovery/discovery.contract";
import { discoveryHandlerFactory } from "./discovery/discovery.handler";
import { verifyRemoteHandlerFactory } from "./discovery/verify-remote.handler";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { remoteInfoHandlerFactory } from "./remote-info/remote-info.handler";

const resolveNativeFedationHandlers = (cacheHandler: TCacheHandler<NativeFederationCache>) => {
    const dependencyHandler = dependencyHandlerFactory(cacheHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(cacheHandler, dependencyHandler);
    const importMapHandler = importMapHandlerFactory(dependencyHandler);
    return {dependencyHandler, remoteInfoHandler, importMapHandler};
}

const resolver = (cache: NativeFederationCache) => {
    const cacheHandler = cacheHandlerFactory(cache);
    return {
        cacheHandler, 
        ...resolveNativeFedationHandlers(cacheHandler)
    };
}

const discoveryResolver = (cache: DiscoveryCache & NativeFederationCache) => {
    const cacheHandler = cacheHandlerFactory(cache);
    const discoveryHandler = discoveryHandlerFactory(cacheHandler);
    const verifyRemoteHandler = verifyRemoteHandlerFactory(cacheHandler);

    return {
        cacheHandler, 
        discoveryHandler,
        verifyRemoteHandler,
        ...resolveNativeFedationHandlers(cacheHandler)
    };
}

export {resolver, discoveryResolver};