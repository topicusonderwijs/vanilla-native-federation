import type { RemoteInfo } from "../remote-info/remote-info.contract";

const NAMESPACE = "__NATIVE_FEDERATION__";

/**
 * ENTRIES
 */
type TCacheEntry<T> = {
    set: (value: T) => TCacheEntry<T>;
    get: () => T;
    exists: () => boolean;
};

type CacheEntryValue<T> = T extends TCacheEntry<infer U> ? U : never;


type CacheOf<T> = {
    [K in keyof T]: TCacheEntry<T[K]>;
};

type CacheEntryCreator = <T>(key: string, initialValue: T) => TCacheEntry<T>;

/**
 * DEFAULT STORED PROPERTIES
 */
type NativeFederationProps = {
    externals: Record<string, string>;
    remoteNamesToRemote: Record<string, RemoteInfo>;
    baseUrlToRemoteNames: Record<string, string>;
}

type NativeFederationCache = CacheOf<NativeFederationProps>



export {NAMESPACE, CacheEntryValue, TCacheEntry, CacheOf, NativeFederationProps, NativeFederationCache, CacheEntryCreator}