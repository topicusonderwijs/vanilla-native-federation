import type { NfCache, StorageEntry, StorageEntryCreator, StorageOf } from './../lib/handlers/storage/storage.contract';
import { toStorage } from '../lib/handlers/storage/to-storage';


const mockStorage: StorageEntryCreator = <T>(key: string, _fallback: T) => {
    const storage = {} as Record<string, any>;
    
    const entry = {
        get(): T {
            return (storage[key] as T) ?? _fallback;
        },
        set(value: T): StorageEntry<T> {
            storage[key] = value;
            return entry;
        },
        exists(): boolean {
            return key in storage;
        }
    };

    return entry;
}

const createMockStorage = <TCache extends NfCache>(cache: TCache): StorageOf<TCache> => {
    return toStorage(cache, mockStorage)
}

export {mockStorage, createMockStorage}