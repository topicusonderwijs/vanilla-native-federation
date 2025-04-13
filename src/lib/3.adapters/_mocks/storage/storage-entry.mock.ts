import { StorageEntry } from "lib/3.adapters/storage/storage.contract";

export const mockStorageEntry = (storageRef: any) => ({
    toStorageEntry: jest.fn(
        <TValue> (key: string, fallback: TValue) => {
            if(!storageRef[key]) storageRef[key] = fallback;
            const mockStorageEntry = {
                get: jest.fn(() => JSON.parse(JSON.stringify(storageRef[key]))),
                set: jest.fn((value) => {
                    storageRef[key] = value;
                    return mockStorageEntry;
                }),
            } as StorageEntry<any>;

            return mockStorageEntry;
        }
    )
})