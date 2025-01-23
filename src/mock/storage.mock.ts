import { Remote } from '../lib/handlers/remote-info/remote-info.contract';
import type { NfStorage, StorageEntry, StorageEntryCreator } from './../lib/handlers/storage/storage.contract';
import { REMOTE_MFE1_MOCK } from './models/remote.mock';

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

const createMockStorage = (): NfStorage =>  ({
    remoteNamesToRemote: createMockStorageEntry(
        'remoteNamesToRemote',
        { [REMOTE_MFE1_MOCK.name]: REMOTE_MFE1_MOCK() } as Record<string, Remote>
    ),
    baseUrlToRemoteNames: createMockStorageEntry(
        'baseUrlToRemoteNames',
        {[REMOTE_MFE1_MOCK().baseUrl]: REMOTE_MFE1_MOCK().name} as Record<string, string>
    ),
    externals: createMockStorageEntry('externals', {})
});

export {createMockStorageEntry, createMockStorage}