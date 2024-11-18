import { type CacheEntryCreator, NAMESPACE, type CacheEntry, type NativeFederationProps, type CacheOf } from "./cache.contract";
import { toCache } from "./cache.handler";

type GlobalCache = {[NAMESPACE]: Record<string, unknown>;};

const globalCacheEntry: CacheEntryCreator = <T>(key: string, _fallback: T) => {
    if (!(globalThis as unknown as GlobalCache)[NAMESPACE]) {
        (globalThis as unknown as GlobalCache)[NAMESPACE] = {};
    }
    const namespace = (globalThis as unknown as GlobalCache)[NAMESPACE];
    
    const entry = {
        get(): T {
            return (namespace[key] as T) ?? _fallback;
        },
        
        set(value: T): CacheEntry<T> {
            namespace[key] = value;
            return entry;
        },
        
        exists(): boolean {
            return key in namespace;
        }
    };

    return entry;
}

const createGlobalCache = <TCache extends NativeFederationProps>(cache: TCache): CacheOf<TCache> => {
    return toCache(cache, globalCacheEntry)
}

export {globalCacheEntry, createGlobalCache};