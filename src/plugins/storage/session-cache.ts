import { toCache } from "../../lib/cache/cache.handler";
import { type CacheEntryCreator, type CacheOf, NAMESPACE, type NativeFederationProps, type TCacheEntry } from "./../../lib/cache/cache.contract";

const sessionStorageCacheEntry: CacheEntryCreator = <T>(key: string, _fallback: T) => {
    const entry = {
        get(): T {
            const str = sessionStorage.getItem(`${NAMESPACE}.${key}`) ?? JSON.stringify(_fallback)
            return JSON.parse(str);
        },
        
        set(value: T): TCacheEntry<T> {
            const clean = typeof value === 'string' ? value : JSON.stringify(value);
            sessionStorage.setItem(`${NAMESPACE}.${key}`, clean)
            return entry;
        },
        
        exists(): boolean {
            return !!sessionStorage.getItem(`${NAMESPACE}.${key}`);
        }
    };

    return entry;
}

const createSessionStorageCache = <TCache extends NativeFederationProps>(cache: TCache): CacheOf<TCache> => {
    return toCache(cache, sessionStorageCacheEntry)
}

export {createSessionStorageCache, sessionStorageCacheEntry};