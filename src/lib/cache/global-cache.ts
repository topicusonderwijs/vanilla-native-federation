import { type CacheEntryCreator, NAMESPACE, type CacheEntry } from "./cache.contract";

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

export {globalCacheEntry};