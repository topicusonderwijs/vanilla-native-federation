import { SharedInfo } from '@softarc/native-federation-runtime';
import { Remote } from '../lib/handlers/remote-info/remote-info.contract';
import type { NfStorage, StorageEntry, StorageEntryCreator } from './../lib/handlers/storage/storage.contract';

const REMOTE_MFE1_MOCK: () => Remote = () => 
    JSON.parse(JSON.stringify({
        name: 'team/mfe1', 
        shared: [
            {
                packageName: "rxjs",
                outFileName: "rxjs.js",
                requiredVersion: "~7.8.0",
                singleton: true,
                strictVersion: true,
                version: "7.8.1",
            }
        ] as SharedInfo[], 
        exposes: [{key: './comp', outFileName: 'comp.js'}], 
        baseUrl: 'http://localhost:3001'
    }))

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