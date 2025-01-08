import type { StorageEntryCreator, StorageEntryValue, StorageOf } from "./storage.contract";

type StorageHandler<TStorage extends StorageOf<Record<keyof TStorage, any>>> = {
    fetch: <K extends keyof TStorage>(key: K) => StorageEntryValue<TStorage[K]>;
    entry: <K extends keyof TStorage>(key: K) => TStorage[K];
    get: () => TStorage;
    mutate: <K extends keyof TStorage>(
        key: K,
        mutateFn: (v: StorageEntryValue<TStorage[K]>) => StorageEntryValue<TStorage[K]>
    ) => StorageHandler<TStorage>;
}

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

const toStorage = <Tprops extends Record<string, any>>(
    props: Tprops,
    cacheEntryCreator: StorageEntryCreator
): StorageOf<Tprops> => {
    return Object.entries(props).reduce(
        (acc, [key, value]) => ({
            ...acc,
            [key]: cacheEntryCreator(key, value)
        }),
        {} as StorageOf<Tprops>
    );
};

export {toStorage, storageHandlerFactory, StorageHandler};