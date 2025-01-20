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

export {nfNamespace, StorageEntryValue, StorageEntry, StorageExtension, StorageOf, NfCache, NfStorage, StorageEntryCreator}