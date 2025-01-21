import type { Remote } from '../remote-info/remote-info.contract';

const nfNamespace = "__NATIVE_FEDERATION__";

/**
 * Records instead of Map
 */
type NfCache = {
    externals: Record<string, string>;
    remoteNamesToRemote: Record<string, Remote>;
    baseUrlToRemoteNames: Record<string, string>;
};

type StorageEntry<T> = {
    set: (value: T) => StorageEntry<T>;
    get: () => T;
    exists: () => boolean;
};

type StorageEntryValue<T> = T extends StorageEntry<infer U> ? U : never;

type StorageOf<T> = {
    [K in keyof T]: StorageEntry<T[K]>;
};

type StorageExtension = StorageOf<Record<string, any>>;

type StorageEntryCreator = <T>(key: string, initialValue: T) => StorageEntry<T>;

type NfStorage = StorageOf<NfCache>

type StorageHandler<TStorage extends StorageOf<Record<keyof TStorage, any>>> = {
    fetch: <K extends keyof TStorage>(key: K) => StorageEntryValue<TStorage[K]>;
    entry: <K extends keyof TStorage>(key: K) => TStorage[K];
    get: () => TStorage;
    mutate: <K extends keyof TStorage>(
        key: K,
        mutateFn: (v: StorageEntryValue<TStorage[K]>) => StorageEntryValue<TStorage[K]>
    ) => StorageHandler<TStorage>;
}

export {nfNamespace, StorageEntryValue, StorageEntry, StorageExtension, StorageOf, NfCache, NfStorage, StorageEntryCreator, StorageHandler}