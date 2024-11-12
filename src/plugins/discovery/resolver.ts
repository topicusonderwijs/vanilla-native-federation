import type { DiscoveryCache } from "./discovery.contract";
import { discoveryHandlerFactory } from "./discovery.handler";
import { remoteModuleHandlerFactory } from "./remote-module.handler";
import type { NativeFederationCache } from "../../lib/cache/cache.contract";
import { cacheHandlerFactory } from "../../lib/cache/cache.handler";
import { resolveNativeFedationHandlers } from "../../lib/resolver";


const resolver = (cache: DiscoveryCache & NativeFederationCache) => {
    const cacheHandler = cacheHandlerFactory(cache);
    const discoveryHandler = discoveryHandlerFactory(cacheHandler);
    const remoteModuleHandler = remoteModuleHandlerFactory(cacheHandler);

    return {
        cacheHandler, 
        discoveryHandler,
        remoteModuleHandler,
        ...resolveNativeFedationHandlers(cacheHandler)
    };
}

export { resolver };