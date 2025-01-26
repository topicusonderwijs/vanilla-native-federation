import { globalThisStorageEntry } from './global-this-storage';
import type { NfStorage, NfCache } from './storage.contract';
import { toStorage } from './to-storage';

const DEFAULT_PROPS: NfCache = {
    externals: {},
    remoteNamesToRemote: {},
    baseUrlToRemoteNames: {}
}

const DEFAULT_STORAGE: NfStorage = toStorage(DEFAULT_PROPS, globalThisStorageEntry);

export {DEFAULT_STORAGE, DEFAULT_PROPS};