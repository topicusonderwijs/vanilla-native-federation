import type { NativeFederationCache } from "./cache/cache.contract";
import  { type TCacheHandler, cacheHandlerFactory } from "./cache/cache.handler";
import { importMapHandlerFactory } from "./import-map/import-map.handler";
import { remoteInfoHandlerFactory } from "./remote-entry/remote-info.handler";
import { sharedInfoHandlerFactory } from "./remote-entry/shared-info.handler";

const resolveNativeFedationHandlers = (cacheHandler: TCacheHandler<NativeFederationCache>) => {
    const sharedInfoHandler = sharedInfoHandlerFactory(cacheHandler);
    const remoteInfoHandler = remoteInfoHandlerFactory(cacheHandler, sharedInfoHandler);
    const importMapHandler = importMapHandlerFactory(sharedInfoHandler);
    return {sharedInfoHandler, remoteInfoHandler, importMapHandler};
}

const resolver = (cache: NativeFederationCache) => {
    const cacheHandler = cacheHandlerFactory(cache);
    return {
        cacheHandler, 
        ...resolveNativeFedationHandlers(cacheHandler)
    };
}



export {resolver, resolveNativeFedationHandlers};