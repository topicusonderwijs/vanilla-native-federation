import type { NativeFederationCache, NativeFederationProps } from './cache.contract';
import { toCache } from './cache.handler';
import { globalCacheEntry } from './global-cache';

const DEFAULT_PROPS: NativeFederationProps = {
    externals: {},
    remoteNamesToRemote: {},
    baseUrlToRemoteNames: {}
}

const DEFAULT_CACHE: NativeFederationCache = toCache(DEFAULT_PROPS, globalCacheEntry);

export {DEFAULT_CACHE, DEFAULT_PROPS};