import type { StorageHandler, StorageEntry, NfCache, StorageEntryCreator, StorageOf } from "./storage.contract";

function storageHandlerFactory<TCache extends NfCache>(
    cache: TCache,
    cacheEntryCreator: StorageEntryCreator
): StorageHandler<TCache> {

    const STORAGE: StorageOf<TCache> = (Object.entries(cache) as { [K in keyof TCache]: [K, TCache[K]]; }[keyof TCache][])
        .reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key]: cacheEntryCreator<TCache, typeof key>(key, value)
            }),
            {} as StorageOf<TCache>
        );

    function entry<K extends keyof TCache>(key: K): StorageEntry<TCache[K]> {
        return STORAGE[key];
    };

    function fetch<K extends keyof TCache>(key: K): TCache[K] {
        return STORAGE[key].get();
    };

    function update<K extends keyof TCache>(
        this:StorageHandler<TCache>,
        key: K,
        updateFn: (v: TCache[K]) => TCache[K]
    ): StorageHandler<TCache> {
        const newVal = updateFn(fetch(key));
        STORAGE[key].set(newVal);
        return this;
    };

    function get(): StorageOf<TCache>{
        return STORAGE;
    }

    return {fetch, get, entry, update};
}

export {storageHandlerFactory};