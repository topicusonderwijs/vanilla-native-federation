import type { StorageEntryCreator, StorageOf } from "./storage.contract";

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

export {toStorage}