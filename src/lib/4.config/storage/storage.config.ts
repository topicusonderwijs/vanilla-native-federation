import type { StorageConfig, StorageOptions } from 'lib/2.app/config/storage.contract';
import { globalThisStorageEntry } from './global-this.storage';

export const createStorageConfig = (override: StorageOptions): StorageConfig => ({
  storage: override.storage
    ? override.storage(override.storageNamespace ?? '__NATIVE_FEDERATION__')
    : globalThisStorageEntry(override.storageNamespace ?? '__NATIVE_FEDERATION__'),
  clearStorage: override.clearStorage ?? false,
});
