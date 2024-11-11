import { type CacheEntryCreator, NAMESPACE, type TCacheEntry } from "./cache.contract";


const localStorageCacheEntry: CacheEntryCreator = <T>(key: string, _fallback: T) => {
    const entry = {
        get(): T {
            const str = localStorage.getItem(`${NAMESPACE}.${key}`) ?? JSON.stringify(_fallback)
            return JSON.parse(str);
        },
        
        set(value: T): TCacheEntry<T> {
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

export {localStorageCacheEntry};