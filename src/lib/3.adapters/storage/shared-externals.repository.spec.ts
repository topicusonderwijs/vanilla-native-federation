import { createSharedExternalsRepository } from './shared-externals.repository';
import { mockStorageEntry } from '../_mocks/storage/storage-entry.mock';
import { SharedExternals } from '../../1.domain/externals/externals.contract';
import { SharedVersion } from '../../1.domain/externals/version.contract';
import { Optional } from '../../utils/optional';

describe('createSharedExternalsRepository', () => {

    const MOCK_VERSION  = (): SharedVersion => ({
        version: "1.2.3", 
        requiredVersion: "~1.2.1", 
        strictVersion: true,
        action: "share",
        url: "http://localhost:3001/shared-dep-B.js"
    });

    const setupWithCache = ((storage: any) => {
        const mockStorage = {"shared-externals": storage};
        const mockStorageConfig = mockStorageEntry(mockStorage);
        const externalsRepo = createSharedExternalsRepository(mockStorageConfig);
        return {mockStorage, externalsRepo};
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            const {mockStorage} = setupWithCache(undefined);
            expect(mockStorage["shared-externals"]).toEqual({});
        });
    })

    describe('getAll', () => {
        it('should return empty object if no shared deps', () => {
            const {externalsRepo} = setupWithCache({});

            const actual: SharedExternals = externalsRepo.getAll();

            expect(actual).toEqual({});
        });

        it('should return all shared deps', () => {
            const {externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});

            const actual: SharedExternals = externalsRepo.getAll();

            expect(actual).toEqual({"dep-a": [MOCK_VERSION()]});
        });
    });

    describe('tryGetVersions', () => {
        it('should return the versions', () => {
            const {externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});

            const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions("dep-a");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual([MOCK_VERSION()]);
        });

        it('should return empty optional if version doesnt exist', () => {
            const {externalsRepo} = setupWithCache({});

            const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions("dep-a");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });

        it('should return empty optional if only other scopes exist', () => {
            const {externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});

            const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions("dep-b");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

    describe('contains', () => {
        it('should return true if shared list is empty', () => {
            const {externalsRepo} = setupWithCache({});
            expect(externalsRepo.contains("dep-a")).toBe(false);
        });

        it('should return false if not in shared list', () => {
            const {externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});
            expect(externalsRepo.contains("dep-b")).toBe(false);
        });

        it('should return true if in shared list', () => {
            const {externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});
            expect(externalsRepo.contains("dep-a")).toBe(true);
        });
    });

    describe('set', () => {
        it('should not set the whole entry if no commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            externalsRepo.set({"dep-a": [MOCK_VERSION()]});
            expect(mockStorage["shared-externals"]).toEqual({});
        });
        it('should set the whole entry after commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            externalsRepo.set({"dep-a": [MOCK_VERSION()]});
            expect(mockStorage["shared-externals"]).toEqual({});
            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({"dep-a": [MOCK_VERSION()]});
        });
        it('should clear the whole entry', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});
            externalsRepo.set({});
            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({});
        });
        it('should replace the whole entry', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});
            externalsRepo.set({"dep-b": []});
            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({"dep-b": []});
        });
    });

    describe('addOrUpdate', () => {
        it('should not add or update if no commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            
            externalsRepo.addOrUpdate("dep-a", [MOCK_VERSION()]);

            expect(mockStorage["shared-externals"]).toEqual({});
        });

        it('should add a new external to empty storage after commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            
            externalsRepo.addOrUpdate("dep-a", [MOCK_VERSION()]);
            expect(mockStorage["shared-externals"]).toEqual({});

            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [MOCK_VERSION()]
            });
        });
    
        it('should replace versions for an existing external', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});

            const newVersion = { ...MOCK_VERSION(), version: "2.0.0" };
                        
            externalsRepo.addOrUpdate("dep-a", [newVersion]);
            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [newVersion]
            });
        });
    
        it('should keep other externals when adding a new one', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": [MOCK_VERSION()]});

            const versionB = { ...MOCK_VERSION(), version: "4.5.6" };
                        
            externalsRepo.addOrUpdate("dep-b", [versionB]);
            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [MOCK_VERSION()],
                "dep-b": [versionB]
            });
        });
    
        it('should keep other externals when updating an existing one', () => {
            const versionA = MOCK_VERSION();
            const versionB = { ...MOCK_VERSION(), version: "4.5.6" };

            const {mockStorage, externalsRepo} = setupWithCache({
                "dep-a": [versionA],
                "dep-b": [versionB]
            });


            const newVersionA = { ...MOCK_VERSION(), version: "2.0.0" };
                        
            externalsRepo.addOrUpdate("dep-a", [newVersionA]);
            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [newVersionA],
                "dep-b": [versionB]
            });
        });
    
        it('should add multiple versions for the same external', () => {
            const version1 = MOCK_VERSION();
            const version2 = { ...MOCK_VERSION(), version: "2.0.0" };

            const {mockStorage, externalsRepo} = setupWithCache({});

            externalsRepo.addOrUpdate("dep-a", [version1, version2]);
            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [version1, version2]
            });
        });
    
        it('should return the repository instance for chaining', () => {
            const {externalsRepo} = setupWithCache({});
            const result = externalsRepo.addOrUpdate("dep-a", [MOCK_VERSION()]);
            expect(result).toBe(externalsRepo);
        });
    });
});