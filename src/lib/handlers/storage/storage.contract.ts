import type { Remote } from '../remote-info/remote-info.contract';

const nfNamespace = "__NATIVE_FEDERATION__";

/**
 * Records instead of Map
 */

type NfCache = {
    externals:{global: Record<string, {version: string, requiredVersion: string, url: string}>} & Record<string, Record<string, {version: string, requiredVersion: string, url: string}>>;
    remoteNamesToRemote: Record<string, Remote>; 
    baseUrlToRemoteNames: Record<string, string>;
};

type StorageEntry<TValue> = {
    set: (value: TValue) => StorageEntry<TValue>;
    get: () => TValue;
};

type StorageEntryKey = number|symbol|string;

type StorageOf<TCache extends NfCache> = {
    [K in keyof TCache]: StorageEntry<TCache[K]>;
};

type StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache = keyof TCache>(key: K, initialValue: TCache[K]) => StorageEntry<TCache[K]>;

type StorageHandler<TCache extends NfCache> = {
    fetch: <K extends keyof TCache>(key: K) => TCache[K];
    get: () => StorageOf<TCache>;
    entry: <K extends keyof TCache>(key: K) => StorageEntry<TCache[K]>;
    update: <K extends keyof TCache>(
        key: K,
        updateFn: (v: TCache[K]) => TCache[K]
    ) => StorageHandler<TCache>;
    
}

const createCache: () => NfCache = () => ({
    externals: {global: {}},
    remoteNamesToRemote: {},
    baseUrlToRemoteNames: {}
})

export {nfNamespace, StorageEntry, StorageEntryKey, StorageOf, NfCache, StorageEntryCreator, StorageHandler, createCache}