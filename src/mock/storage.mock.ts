import type { StorageEntry, StorageEntryCreator } from './../lib/storage/storage.contract';

const createMockStorageEntry: StorageEntryCreator = <T>(_: string, initialValue: T): StorageEntry<T> => {
    let value = initialValue;

    const mockEntry = {
        get: () => value,
        set: (newValue: T) => {
            value = newValue;
            return mockEntry;
        },
        exists: () => true
    };

    return mockEntry;
};




export {createMockStorageEntry}