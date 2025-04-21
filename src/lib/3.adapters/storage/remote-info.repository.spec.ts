import { RemoteInfo } from 'lib/1.domain/remote/remote-info.contract';
import { createRemoteInfoRepository } from './remote-info.repository';
import { Optional } from 'lib/utils/optional';
import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { MOCK_REMOTE_INFO_I, MOCK_REMOTE_INFO_II } from "lib/6.mocks/domain/remote-info/remote-info.mock";
import { MOCK_REMOTE_ENTRY_SCOPE_I_URL } from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';

describe('createRemoteInfoRepository', () => {

    const setupWithCache = ((storage: any) => {
        const mockStorage = {"remotes": storage};
        const mockStorageEntry = createStorageHandlerMock(mockStorage);
        const remoteInfoRepo = createRemoteInfoRepository({storage: mockStorageEntry, clearCache: false});
        return {mockStorage, mockStorageEntry, remoteInfoRepo};
    });


    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            const {mockStorage} = setupWithCache(undefined);
            expect(mockStorage["remotes"]).toEqual({});
        });

        it('should reset cache when in config', () => {
            const mockStorage = {"remotes": {
                "team/mfe1": MOCK_REMOTE_INFO_I()
            }};
            const mockStorageEntry = createStorageHandlerMock(mockStorage);
            createRemoteInfoRepository({storage: mockStorageEntry, clearCache: true});

            expect(mockStorage["remotes"]).toEqual({});
        });
    });


    describe('contains', () => {
        it('should return false when empty', () => {
            const {remoteInfoRepo} = setupWithCache({});

            const result = remoteInfoRepo.contains('team/mfe1');

            expect(result).toBe(false);
        });

        it('should return true when exists', () => {
            const {remoteInfoRepo} = setupWithCache({
                "team/mfe1": MOCK_REMOTE_INFO_I()
            });

            const result = remoteInfoRepo.contains('team/mfe1');

            expect(result).toBe(true);
        });

        it('should return false when entry doesnt exist', () => {
            const {remoteInfoRepo} = setupWithCache({
                "team/mfe1": MOCK_REMOTE_INFO_I()
            });

            const result = remoteInfoRepo.contains('team/mfe2');

            expect(result).toBe(false);
        });

        it('should return false when entry is lost', () => {
            const {remoteInfoRepo} = setupWithCache({});

            const result = remoteInfoRepo.contains('team/mfe2');

            expect(result).toBe(false);
        });
    });

    describe('addOrUpdate', () => {

        it('should not alter storage if not committed', () => {
            const {remoteInfoRepo, mockStorage} = setupWithCache({});

            remoteInfoRepo.addOrUpdate("team/mfe1", MOCK_REMOTE_INFO_I());

            expect(mockStorage["remotes"]).toEqual({});
        });

        it('should update changes after commit', () => {
            const {remoteInfoRepo, mockStorage} = setupWithCache({});

            remoteInfoRepo.addOrUpdate("team/mfe1", MOCK_REMOTE_INFO_I());
            expect(mockStorage["remotes"]).toEqual({});

            remoteInfoRepo.commit();
            expect(mockStorage["remotes"]).toEqual({"team/mfe1": MOCK_REMOTE_INFO_I()});
        });

        it('should update if not in list', () => {
            const {remoteInfoRepo, mockStorage} = setupWithCache({"team/mfe1": "MOCK_REMOTE_INFO"});


            remoteInfoRepo.addOrUpdate("team/mfe1", MOCK_REMOTE_INFO_I());
            remoteInfoRepo.commit();

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO_I());
        });

        it('should not affect other entries', () => {
            const {remoteInfoRepo, mockStorage} = setupWithCache({
                "team/mfe1": MOCK_REMOTE_INFO_I()
            });

            remoteInfoRepo.addOrUpdate("team/mfe2", MOCK_REMOTE_INFO_II());
            remoteInfoRepo.commit();

            expect(mockStorage["remotes"]["team/mfe1"]).toEqual(MOCK_REMOTE_INFO_I());
            expect(mockStorage["remotes"]["team/mfe2"]).toEqual(MOCK_REMOTE_INFO_II());
        });

        it('should return the repository instance for chaining', () => {
            const {remoteInfoRepo} = setupWithCache({});
            const result = remoteInfoRepo.addOrUpdate("team/mfe1", MOCK_REMOTE_INFO_I());
            expect(result).toBe(remoteInfoRepo);
        });
    });

    describe('tryGet', () => {
        it('should return the remote', () => {
            const {remoteInfoRepo} = setupWithCache({
                "team/mfe1": MOCK_REMOTE_INFO_I()
            });

            const actual: Optional<RemoteInfo> = remoteInfoRepo.tryGet("team/mfe1");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual(MOCK_REMOTE_INFO_I());
        });

        it('should return empty optional if remote doesnt exist', () => {
            const {remoteInfoRepo} = setupWithCache({});
            const actual: Optional<RemoteInfo> = remoteInfoRepo.tryGet("team/mfe1");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });

        it('should return empty optional if only other remotes exist', () => {
            const {remoteInfoRepo} = setupWithCache({
                "team/mfe1": MOCK_REMOTE_INFO_I()
            });

            const actual: Optional<RemoteInfo> = remoteInfoRepo.tryGet("team/mfe2");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

    describe('tryGetModule', () => {
        it('should return the exposed module', () => {
            const {remoteInfoRepo} = setupWithCache({
                "team/mfe1": MOCK_REMOTE_INFO_I()
            });

            const actual: Optional<string> = remoteInfoRepo.tryGetModule("team/mfe1", "./wc-comp-a");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual(`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}component-a.js`);
        });

        it('should return empty optional if module doesnt exist', () => {
            const {remoteInfoRepo} = setupWithCache({
                "team/mfe1": MOCK_REMOTE_INFO_I()
            });

            const actual: Optional<string> = remoteInfoRepo.tryGetModule("team/mfe1", "./wc-comp-c");

            expect(actual.isPresent()).toBe(false);
        });

        it('should return empty optional if remote-info doesnt exist', () => {
            const {remoteInfoRepo} = setupWithCache({});

            const actual: Optional<string> = remoteInfoRepo.tryGetModule("team/mfe1", "./wc-comp-a");

            expect(actual.isPresent()).toBe(false);
        });
    });
});