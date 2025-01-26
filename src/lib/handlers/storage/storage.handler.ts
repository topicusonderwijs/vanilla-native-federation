import type { StorageEntryValue, StorageHandler, StorageOf } from "./storage.contract";

function storageHandlerFactory<TStorage extends StorageOf<Record<keyof TStorage, any>>>(
    _cache: TStorage
): StorageHandler<TStorage> {
    const entry = <K extends keyof TStorage>(key: K): TStorage[K] => {
        return _cache[key];
    };

    const fetch = <K extends keyof TStorage>(key: K): StorageEntryValue<TStorage[K]> => {
        return _cache[key].get();
    };

    const mutate = <K extends keyof TStorage>(
        key: K,
        mutateFn: (v: StorageEntryValue<TStorage[K]>) => StorageEntryValue<TStorage[K]>
    ): StorageHandler<TStorage> => {
        const newVal = mutateFn(fetch(key));
        _cache[key].set(newVal);
        return storageHandlerFactory(_cache);
    };

    const get = (): TStorage => _cache;

    return { fetch, mutate, get, entry };
}

export {storageHandlerFactory, StorageHandler};