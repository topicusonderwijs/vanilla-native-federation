import { RemoteInfo } from '../../1.domain/remote/remote-info.contract';
import { createRemoteInfoRepository } from './remote-info.repository';
import type { StorageEntry, StorageConfig, StorageEntryCreator } from './storage.contract';

describe('createRemoteInfoRepository', () => {
    let mockStorageEntryCreator: StorageEntryCreator;
    let mockStorageConfig: StorageConfig;
    let mockStorage: any;

    const MOCK_REMOTE_INFO = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3001/",
        remoteName: "team/mfe1",
        exposes: [{ moduleName: "./comp", url: "http://localhost:3001/comp.js" }]
    });

    const MOCK_REMOTE_INFO_II = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3002/",
        remoteName: "team/mfe2",
        exposes: [{ moduleName: "./comp", url: "http://localhost:3002/comp.js" }]
    });

    beforeEach(() => {
        mockStorage = {};


        mockStorageEntryCreator = <TValue>
            (key: string, initialValue: TValue) => {
                mockStorage[key] = initialValue;

                const mockStorageEntry = {
                    get: jest.fn(() => mockStorage[key]),
                    set: jest.fn((value) => {
                        mockStorage[key] = value;
                        return mockStorageEntry;
                    })
                } as StorageEntry<any>;

                return mockStorageEntry;
            }



        mockStorageConfig = {
            toStorageEntry: jest.fn(mockStorageEntryCreator)
        };
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            
            createRemoteInfoRepository(mockStorageConfig);

            expect(mockStorageConfig.toStorageEntry).toHaveBeenCalledWith('remotes', {});
            expect(mockStorage["remotes"]).toEqual({});
        });
    })

    describe('contains', () => {
        it('should return false when empty', () => {
            const repository = createRemoteInfoRepository(mockStorageConfig);

            const result = repository.contains('team/mfe1');

            expect(result).toBe(false);
        });

        it('should return true when exists', () => {
            const repository = createRemoteInfoRepository(mockStorageConfig);
            mockStorage["remotes"]["team/mfe1"] = MOCK_REMOTE_INFO();

            const result = repository.contains('team/mfe1');

            expect(result).toBe(true);
        });

        it('should return false when entry doesnt exist', () => {
            const repository = createRemoteInfoRepository(mockStorageConfig);
            mockStorage["remotes"]["team/mfe1"] = MOCK_REMOTE_INFO();

            const result = repository.contains('team/mfe2');

            expect(result).toBe(false);
        });
    });

    describe('addOrUpdate', () => {
        it('should add if not in list', () => {
            const repository = createRemoteInfoRepository(mockStorageConfig);

            repository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
        });

        it('should update if not in list', () => {
            const repository = createRemoteInfoRepository(mockStorageConfig);
            mockStorage["remotes"]["team/mfe1"] = "MOCK_REMOTE_INFO";

            repository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
        });

        it('should create object if undefined', () => {
            const repository = createRemoteInfoRepository(mockStorageConfig);
            mockStorage["remotes"] = undefined;

            repository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
        });

        it('should not affect other entries', () => {
            const repository = createRemoteInfoRepository(mockStorageConfig);
            mockStorage["remotes"]["team/mfe2"] = MOCK_REMOTE_INFO_II();

            repository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
            expect(mockStorage["remotes"]["team/mfe2"]).toEqual(MOCK_REMOTE_INFO_II());
        });
    });
});