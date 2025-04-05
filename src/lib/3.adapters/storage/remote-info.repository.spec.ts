import { RemoteInfo } from '../../1.domain/remote/remote-info.contract';
import { createRemoteInfoRepository } from './remote-info.repository';
import { Optional } from '../../utils/optional';

import type { StorageEntry, StorageConfig } from './storage.contract';
import type { ForStoringRemoteInfo } from '../../2.app/driving-ports/for-storing-remote-info.port';

describe('createRemoteInfoRepository', () => {
    let mockStorageConfig: StorageConfig;
    let mockStorage: any;
    let remoteInfoRepository: ForStoringRemoteInfo;

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

        mockStorageConfig = {
            toStorageEntry: jest.fn(
                <TValue> (key: string, initialValue: TValue) => {
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
            )
        };

        remoteInfoRepository = createRemoteInfoRepository(mockStorageConfig);
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            expect(mockStorageConfig.toStorageEntry).toHaveBeenCalledWith('remotes', {});
            expect(mockStorage["remotes"]).toEqual({});
        });
    })

    describe('contains', () => {
        it('should return false when empty', () => {
            const result = remoteInfoRepository.contains('team/mfe1');

            expect(result).toBe(false);
        });

        it('should return true when exists', () => {
            mockStorage["remotes"]["team/mfe1"] = MOCK_REMOTE_INFO();

            const result = remoteInfoRepository.contains('team/mfe1');

            expect(result).toBe(true);
        });

        it('should return false when entry doesnt exist', () => {
            mockStorage["remotes"]["team/mfe1"] = MOCK_REMOTE_INFO();

            const result = remoteInfoRepository.contains('team/mfe2');

            expect(result).toBe(false);
        });

        it('should return false when entry is lost', () => {
            mockStorage = {};

            const result = remoteInfoRepository.contains('team/mfe2');

            expect(result).toBe(false);
        });
    });

    describe('addOrUpdate', () => {
        it('should add if not in list', () => {
            remoteInfoRepository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
        });

        it('should update if not in list', () => {
            mockStorage["remotes"]["team/mfe1"] = "MOCK_REMOTE_INFO";

            remoteInfoRepository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
        });

        it('should create object if undefined', () => {
            mockStorage["remotes"] = undefined;

            remoteInfoRepository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
        });

        it('should not affect other entries', () => {
            mockStorage["remotes"]["team/mfe2"] = MOCK_REMOTE_INFO_II();

            remoteInfoRepository.addOrUpdate(MOCK_REMOTE_INFO());

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO());
            expect(mockStorage["remotes"]["team/mfe2"]).toEqual(MOCK_REMOTE_INFO_II());
        });
    });

    describe('tryGet', () => {
        it('should return the remote', () => {
            mockStorage["remotes"]["team/mfe1"] = MOCK_REMOTE_INFO();

            const actual: Optional<RemoteInfo> = remoteInfoRepository.tryGet("team/mfe1");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual(MOCK_REMOTE_INFO());
        });

        it('should return empty optional if remote doesnt exist', () => {
            const actual: Optional<RemoteInfo> = remoteInfoRepository.tryGet("team/mfe1");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });

        it('should return empty optional if only other remotes exist', () => {
            mockStorage["remotes"]["team/mfe1"] = MOCK_REMOTE_INFO();

            const actual: Optional<RemoteInfo> = remoteInfoRepository.tryGet("team/mfe2");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

});