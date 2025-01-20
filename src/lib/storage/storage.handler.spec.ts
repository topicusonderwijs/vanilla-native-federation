import type { NfCache, StorageOf } from './storage.contract';
import { toStorage, storageHandlerFactory, type StorageHandler } from './storage.handler';
import { createMockStorageEntry } from '../../mock/storage.mock';
import { Remote, SharedInfo } from '../remote-info/remote-info.contract';
import { REMOTE_MFE1_MOCK, REMOTE_MFE2_MOCK } from '../../mock/models/remote.mock';

describe('storageHandlerFactory', () => {

    let mockStorage: StorageOf<NfCache>;
    let handler: StorageHandler<StorageOf<NfCache>>;

    beforeEach(() => {
        const remote1 = REMOTE_MFE1_MOCK();
        mockStorage = {
            remoteNamesToRemote: createMockStorageEntry(
                'remoteNamesToRemote',
                { [remote1.name]: remote1 } as Record<string, Remote>
            ),
            baseUrlToRemoteNames: createMockStorageEntry(
                'baseUrlToRemoteNames',
                {[remote1.baseUrl]: remote1.name} as Record<string, string>
            ),
            externals: createMockStorageEntry('externals', {})
        };
        handler = storageHandlerFactory(mockStorage);
    });

    describe('fetch', () => {
        it('should retrieve the current value of a storage entry', () => {
            const expected_remote = REMOTE_MFE1_MOCK();

            expect(handler.fetch('externals')).toEqual({});
            expect(handler.fetch('baseUrlToRemoteNames')).toEqual({[expected_remote.baseUrl]: [expected_remote.name]});
        });
    });

    describe('entry', () => {
        it('should return the storage entry object', () => {
            const expected_remote = REMOTE_MFE1_MOCK();
            const new_remote = REMOTE_MFE2_MOCK();

            const cacheEntry = handler.entry('baseUrlToRemoteNames')
            expect(cacheEntry.get()).toEqual({[expected_remote.baseUrl]: [expected_remote.name]});
            
            cacheEntry.set({[new_remote.baseUrl]: new_remote.baseUrl})
            expect(cacheEntry.get()).toEqual({[new_remote.baseUrl]: [new_remote.name]});

            expect(cacheEntry.exists()).toEqual(true);
        });
    });

    describe('get', () => {
        it('should return the entire storage object', () => {
            const storage = handler.get();
            expect(storage).toBe(mockStorage);
            expect(storage.baseUrlToRemoteNames.get()).toEqual({'http://localhost:3001/mfe1': 'team/mfe1'});
            expect(storage.remoteNamesToRemote.get()).toEqual({
                'team/mfe1': {
                    name: 'team/mfe1', 
                    shared: [] as SharedInfo[], 
                    exposes: [{key: './Comp', outFileName: 'main.js'}], 
                    baseUrl: 'http://localhost:3001/mfe1'
                }
            } as Record<string, Remote>);
            expect(storage.externals.get()).toEqual({});
        });
    });

    describe('mutate', () => {
        it('should add a value', () => {
            const newHandler = handler.mutate('baseUrlToRemoteNames', (v) => {
                return {...v, 'http://localhost:3001/mfe2': 'team/mfe2'}
            });
            expect(newHandler.fetch('baseUrlToRemoteNames')['http://localhost:3001/mfe2']).toEqual('team/mfe2');
            expect(newHandler.fetch('baseUrlToRemoteNames')['http://localhost:3001/mfe1']).toEqual('team/mfe1');
        });

        it('should update a value', () => {
            const newHandler = handler.mutate('baseUrlToRemoteNames', _ => {
                return {'http://localhost:3001/mfe2': 'team/mfe2'}
            });
            expect(newHandler.fetch('baseUrlToRemoteNames')['http://localhost:3001/mfe2']).toEqual('team/mfe2');
            expect(newHandler.fetch('baseUrlToRemoteNames')['http://localhost:3001/mfe1']).toBeUndefined();
        });


        it('should point to the same storage instance', () => {
            const newHandler = handler.mutate('baseUrlToRemoteNames', (v) => {
                return {...v, 'http://localhost:3001/mfe2': 'team/mfe2'}
            });
            expect(newHandler).not.toBe(handler);

            expect(Object.keys(newHandler.fetch('baseUrlToRemoteNames')).length).toBe(2);
            expect(Object.keys(handler.fetch('baseUrlToRemoteNames')).length).toBe(2);
        });
    });
});


describe('toStorage', () => {
    it('should convert a plain object to a storage object', () => {
        const mockStorageEntryCreator = jest.fn(createMockStorageEntry);
        const initialProps = {
            count: 0,
            name: 'test'
        };

        const storage = toStorage(initialProps, mockStorageEntryCreator);

        expect(mockStorageEntryCreator).toHaveBeenCalledTimes(2);
        expect(mockStorageEntryCreator).toHaveBeenCalledWith('count', 0);
        expect(mockStorageEntryCreator).toHaveBeenCalledWith('name', 'test');
        
        expect(storage.count.get()).toBe(0);
        expect(storage.name.get()).toBe('test');
    });

    it('should handle nested objects and arrays', () => {
        const mockStorageEntryCreator = jest.fn(createMockStorageEntry);
        const initialProps = {
            nested: { key: 'value' },
            array: [1, 2, 3]
        };

        const storage = toStorage(initialProps, mockStorageEntryCreator);

        expect(mockStorageEntryCreator).toHaveBeenCalledTimes(2);
        expect(storage.nested.get()).toEqual({ key: 'value' });
        expect(storage.array.get()).toEqual([1, 2, 3]);
    });

    it('should handle empty objects', () => {
        const mockStorageEntryCreator = jest.fn(createMockStorageEntry);
        const storage = toStorage({}, mockStorageEntryCreator);

        expect(mockStorageEntryCreator).not.toHaveBeenCalled();
        expect(Object.keys(storage)).toHaveLength(0);
    });
});