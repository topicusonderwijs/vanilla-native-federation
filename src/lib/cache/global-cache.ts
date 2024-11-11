import { type CacheEntryCreator, NAMESPACE, type TCacheEntry } from "./cache.contract";

type TGlobalCache = {[NAMESPACE]: Record<string, unknown>;};

const globalCacheEntry: CacheEntryCreator = <T>(key: string, _fallback: T) => {
    if (!(globalThis as unknown as TGlobalCache)[NAMESPACE]) {
        (globalThis as unknown as TGlobalCache)[NAMESPACE] = {};
    }
    const namespace = (globalThis as unknown as TGlobalCache)[NAMESPACE];
    
    const entry = {
        get(): T {
            return (namespace[key] as T) ?? _fallback;
        },
        
        set(value: T): TCacheEntry<T> {
            namespace[key] = value;
            return entry;
        },
        
        exists(): boolean {
            return key in namespace;
        }
    };

    return entry;
}

export {globalCacheEntry};