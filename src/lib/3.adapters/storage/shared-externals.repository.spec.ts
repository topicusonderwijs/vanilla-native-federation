import { createSharedExternalsRepository } from './shared-externals.repository';
import { SharedExternals } from '../../1.domain/externals/external.contract';
import { SharedVersion } from '../../1.domain/externals/version.contract';
import { createStorageHandlerMock } from '../../6.mocks/handlers/storage.mock';
import { Optional } from '../../utils/optional';
import { MOCK_VERSION_II } from '../../6.mocks/domain/externals/version.mock';

describe('createSharedExternalsRepository', () => {
    const setupWithCache = ((storage: any) => {
        const mockStorage = {"shared-externals": storage};
        const mockStorageEntry = createStorageHandlerMock(mockStorage);
        const externalsRepo = createSharedExternalsRepository({storage: mockStorageEntry, clearCache: false});
        return {mockStorage, externalsRepo};
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            const {mockStorage} = setupWithCache(undefined);
            expect(mockStorage["shared-externals"]).toEqual({});
        });

        it('should reset cache when in config', () => {
            const mockStorage = {"shared-externals": {"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }}};
            const mockStorageEntry = createStorageHandlerMock(mockStorage);
            createSharedExternalsRepository({storage: mockStorageEntry, clearCache: true});
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
            const {externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});

            const actual: SharedExternals = externalsRepo.getAll();

            expect(actual).toEqual({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
        });
    });

    describe('tryGetVersions', () => {
        it('should return the versions', () => {
            const {externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});

            const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions("dep-a");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual([MOCK_VERSION_II()]);
        });

        it('should return empty optional if version doesnt exist', () => {
            const {externalsRepo} = setupWithCache({});

            const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions("dep-a");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });

        it('should return empty optional if only other scopes exist', () => {
            const {externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});

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
            const {externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
            expect(externalsRepo.contains("dep-b")).toBe(false);
        });

        it('should return true if in shared list', () => {
            const {externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
            expect(externalsRepo.contains("dep-a")).toBe(true);
        });
    });

    describe('set', () => {
        it('should not set the whole entry if no commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            externalsRepo.set({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
            expect(mockStorage["shared-externals"]).toEqual({});
        });
        it('should set the whole entry after commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            externalsRepo.set({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
            expect(mockStorage["shared-externals"]).toEqual({});
            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
        });
        it('should clear the whole entry', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
            externalsRepo.set({});
            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({});
        });
        it('should replace the whole entry', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});
            externalsRepo.set({"dep-b": { dirty: false, versions: [] }});
            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({"dep-b": { dirty: false, versions: [] }});
        });
    });

    describe('addOrUpdate', () => {
        it('should not add or update if no commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            
            externalsRepo.addOrUpdate("dep-a", { dirty: false, versions: [MOCK_VERSION_II()] });

            expect(mockStorage["shared-externals"]).toEqual({});
        });

        it('should add a new external to empty storage after commit', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            
            externalsRepo.addOrUpdate("dep-a", { dirty: false, versions: [MOCK_VERSION_II()] });
            expect(mockStorage["shared-externals"]).toEqual({});

            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }
            });
        });

        it('should add a new dirty external to the storage', () => {
            const {mockStorage, externalsRepo} = setupWithCache({});
            
            externalsRepo.addOrUpdate("dep-a", { dirty: true, versions: [MOCK_VERSION_II()] });
            expect(mockStorage["shared-externals"]).toEqual({});

            externalsRepo.commit();
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": { dirty: true, versions: [MOCK_VERSION_II()] }
            });
        });
    
        it('should replace versions for an existing external', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});

            const newVersion = { ...MOCK_VERSION_II(), version: "2.0.0" };
                        
            externalsRepo.addOrUpdate("dep-a", { dirty: false, versions: [newVersion]});

            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": { dirty: false, versions: [newVersion]}
            });
        });
    
        it('should keep other externals when adding a new one', () => {
            const {mockStorage, externalsRepo} = setupWithCache({"dep-a": { dirty: false, versions: [MOCK_VERSION_II()] }});

            const versionB = { ...MOCK_VERSION_II(), version: "4.5.6" };
                        
            externalsRepo.addOrUpdate("dep-b", { dirty: false, versions: [versionB]});

            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": { dirty: false, versions: [MOCK_VERSION_II()] },
                "dep-b": { dirty: false, versions: [versionB]}
            });
        });
    
        it('should keep other externals when updating an existing one', () => {
            const versionA = MOCK_VERSION_II();
            const versionB = { ...MOCK_VERSION_II(), version: "4.5.6" };

            const {mockStorage, externalsRepo} = setupWithCache({
                "dep-a": { dirty: false, versions: [versionA]},
                "dep-b": { dirty: false, versions: [versionB]}
            });


            const newVersionA = { ...MOCK_VERSION_II(), version: "2.0.0" };
                        
            externalsRepo.addOrUpdate("dep-a", { dirty: false, versions: [newVersionA]});
            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": { dirty: false, versions: [newVersionA]},
                "dep-b": { dirty: false, versions: [versionB]}
            });
        });
    
        it('should add multiple versions for the same external', () => {
            const version1 = MOCK_VERSION_II();
            const version2 = { ...MOCK_VERSION_II(), version: "2.0.0" };

            const {mockStorage, externalsRepo} = setupWithCache({});

            externalsRepo.addOrUpdate("dep-a", { dirty: false, versions: [version1, version2]});
            externalsRepo.commit();

            expect(mockStorage["shared-externals"]).toEqual({ 
                "dep-a": {
                    dirty: false, 
                    versions: [version1, version2]
                }
            });
        });
    
        it('should return the repository instance for chaining', () => {
            const {externalsRepo} = setupWithCache({});
            const result = externalsRepo.addOrUpdate("dep-a", { dirty: false, versions: [MOCK_VERSION_II()] });
            expect(result).toBe(externalsRepo);
        });
    });
});