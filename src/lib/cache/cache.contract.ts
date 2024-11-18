import type { RemoteInfo } from "../remote-entry/remote-info.contract";

const NAMESPACE = "__NATIVE_FEDERATION__";

/**
 * ENTRIES
 */
type CacheEntry<T> = {
    set: (value: T) => CacheEntry<T>;
    get: () => T;
    exists: () => boolean;
};

type CacheEntryValue<T> = T extends CacheEntry<infer U> ? U : never;


type CacheOf<T> = {
    [K in keyof T]: CacheEntry<T[K]>;
};

type CacheExtension = CacheOf<Record<string, any>>;

type CacheEntryCreator = <T>(key: string, initialValue: T) => CacheEntry<T>;

/**
 * DEFAULT STORED PROPERTIES
 */
type NativeFederationProps = {
    externals: Record<string, string>;
    remoteNamesToRemote: Record<string, RemoteInfo>;
    baseUrlToRemoteNames: Record<string, string>;
}

type NativeFederationCache = CacheOf<NativeFederationProps>

export {NAMESPACE, CacheEntryValue, CacheEntry, CacheExtension, CacheOf, NativeFederationProps, NativeFederationCache, CacheEntryCreator}