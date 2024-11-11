import { type CacheEntryCreator, NAMESPACE,  type TCacheEntry } from "./cache.contract";

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

export {sessionStorageCacheEntry};