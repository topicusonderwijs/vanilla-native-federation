import type { NativeFederationCache } from './cache.contract';
import { toCache } from './cache.handler';
import { globalCacheEntry } from './global-cache';

const DEFAULT_CACHE: NativeFederationCache = toCache({
    externals: {},
    remoteNamesToRemote: {},
    baseUrlToRemoteNames: {}
}, globalCacheEntry);

export {DEFAULT_CACHE};