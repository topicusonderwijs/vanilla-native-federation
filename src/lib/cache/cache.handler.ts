import type { CacheEntryCreator, CacheEntryValue, CacheOf } from "./cache.contract";

interface TCacheHandler<TCache extends CacheOf<Record<keyof TCache, any>>> {
    fetch: <K extends keyof TCache>(key: K) => CacheEntryValue<TCache[K]>;
    entry: <K extends keyof TCache>(key: K) => TCache[K];
    get: () => TCache;
    mutate: <K extends keyof TCache>(
        key: K,
        mutateFn: (v: CacheEntryValue<TCache[K]>) => CacheEntryValue<TCache[K]>
    ) => TCacheHandler<TCache>;
}

function cacheHandlerFactory<TCache extends CacheOf<Record<keyof TCache, any>>>(
    _cache: TCache
): TCacheHandler<TCache> {
    const entry = <K extends keyof TCache>(key: K): TCache[K] => {
        return _cache[key];
    };

    const fetch = <K extends keyof TCache>(key: K): CacheEntryValue<TCache[K]> => {
        return _cache[key].get();
    };

    const mutate = <K extends keyof TCache>(
        key: K,
        mutateFn: (v: CacheEntryValue<TCache[K]>) => CacheEntryValue<TCache[K]>
    ): TCacheHandler<TCache> => {
        const newVal = mutateFn(fetch(key));
        _cache[key].set(newVal);
        return cacheHandlerFactory(_cache);
    };

    const get = (): TCache => _cache;

    return { fetch, mutate, get, entry };
}

const toCache = <Tprops extends Record<string, any>>(
    props: Tprops,
    cacheEntryCreator: CacheEntryCreator
): CacheOf<Tprops> => {
    return Object.entries(props).reduce(
        (acc, [key, value]) => ({
            ...acc,
            [key]: cacheEntryCreator(key, value)
        }),
        {} as CacheOf<Tprops>
    );
};

export {toCache, cacheHandlerFactory, TCacheHandler};