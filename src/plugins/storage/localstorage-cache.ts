import { toCache } from "../../lib/cache/cache.handler";
import { type CacheEntryCreator, type CacheOf, NAMESPACE, type NativeFederationProps, type CacheEntry } from "./../../lib/cache/cache.contract";

const localStorageCacheEntry: CacheEntryCreator = <T>(key: string, _fallback: T) => {
    const entry = {
        get(): T {
            const str = localStorage.getItem(`${NAMESPACE}.${key}`) ?? JSON.stringify(_fallback)
            return JSON.parse(str);
        },
        
        set(value: T): CacheEntry<T> {
            const clean = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(`${NAMESPACE}.${key}`, clean)
            return entry;
        },
        
        exists(): boolean {
            return !!localStorage.getItem(`${NAMESPACE}.${key}`);
        }
    };

    return entry;
}

const createLocalStorageCache = <TCache extends NativeFederationProps>(cache: TCache): CacheOf<TCache> => {
    return toCache(cache, localStorageCacheEntry)
}

export {createLocalStorageCache, localStorageCacheEntry};