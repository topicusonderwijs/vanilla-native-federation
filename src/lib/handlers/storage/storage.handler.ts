import type { StorageHandler, StorageEntry, NfCache, StorageOf } from "./storage.contract";
import type { StorageConfig } from "../../utils/config/config.contract";

const storageHandlerFactory = <TCache extends NfCache>(
    {cache, toStorageEntry}: StorageConfig<TCache>
): StorageHandler<TCache>=> {

    const STORAGE: StorageOf<TCache> = (Object.entries(cache) as { [K in keyof TCache]: [K, TCache[K]]; }[keyof TCache][])
        .reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key]: toStorageEntry<TCache, typeof key>(key, value)
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
        key: K,
        updateFn: (v: TCache[K]) => TCache[K]
    ): StorageHandler<TCache> {
        const newVal = updateFn(fetch(key));
        STORAGE[key].set(newVal);
        return handler;
    };

    function get(): StorageOf<TCache>{
        return STORAGE;
    }

    const handler = {fetch, get, entry, update};

    return handler;
}

export {storageHandlerFactory};