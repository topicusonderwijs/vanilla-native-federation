import type { NfCache, StorageEntry, StorageEntryCreator } from './../lib/handlers/storage/storage.contract';


const mockStorageEntry: StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache = keyof TCache>
    (key: K, initialValue: TCache[K]) => {
        const STORAGE = { [key]: initialValue } as Pick<TCache, K>;

        const entry: StorageEntry<TCache[K]> = {
            get(): TCache[K] {
                return STORAGE[key]!;
            },
            set(value: TCache[K]): StorageEntry<TCache[K]> {
                STORAGE[key] = value;
                return entry;
            }
        };

        return entry;
    }
export {mockStorageEntry}