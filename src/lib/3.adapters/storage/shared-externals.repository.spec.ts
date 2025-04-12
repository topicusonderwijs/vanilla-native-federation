import type { SharedExternals } from '../../1.domain/externals/externals.contract';
import { createSharedExternalsRepository } from './shared-externals.repository';
import type { SharedVersion } from '../../1.domain/externals/version.contract';
import type { StorageEntry, StorageConfig } from './storage.contract';
import type { ForStoringSharedExternals } from '../../2.app/driving-ports/for-storing-shared-externals.port';
import { Optional } from '../../utils/optional';

describe('createSharedExternalsRepository', () => {
    let mockStorageConfig: StorageConfig;
    let mockStorage: any;
    let externalsRepository: ForStoringSharedExternals;

    const MOCK_VERSION  = (): SharedVersion => ({
        version: "1.2.3", 
        requiredVersion: "~1.2.1", 
        strictVersion: true,
        action: "share",
        url: "http://localhost:3001/shared-dep-B.js"
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
                        }),
                        mutate: jest.fn((valueFn) => {
                            mockStorage[key] = valueFn(mockStorage[key]);
                            return mockStorageEntry;
                        })
                    } as StorageEntry<any>;

                    return mockStorageEntry;
                }
            )
        };

        externalsRepository = createSharedExternalsRepository(mockStorageConfig);
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            expect(mockStorageConfig.toStorageEntry).toHaveBeenCalled();
            expect(mockStorage["shared-externals"]).toEqual({ });

        });
    })

    describe('getAll', () => {
        it('should return empty object if no shared deps', () => {
            const actual: SharedExternals = externalsRepository.getAll();

            expect(actual).toEqual({});
        });

        it('should return all shared deps', () => {
            mockStorage["shared-externals"] = {"dep-a": [MOCK_VERSION()]};

            const actual: SharedExternals = externalsRepository.getAll();

            expect(actual).toEqual({"dep-a": [MOCK_VERSION()]});
        });
    });

    describe('tryGetVersions', () => {
        it('should return the versions', () => {
            mockStorage["shared-externals"] = {"dep-a": [MOCK_VERSION()]};

            const actual: Optional<SharedVersion[]> = externalsRepository.tryGetVersions("dep-a");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual([MOCK_VERSION()]);
        });

        it('should return empty optional if scope doesnt exist', () => {
            const actual: Optional<SharedVersion[]> = externalsRepository.tryGetVersions("dep-a");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });

        it('should return empty optional if only other scopes exist', () => {
            mockStorage["shared-externals"] = {"dep-a": [MOCK_VERSION()]};

            const actual: Optional<SharedVersion[]> = externalsRepository.tryGetVersions("dep-b");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

    describe('contains', () => {
        it('should return true if shared list is empty', () => {
            expect(externalsRepository.contains("dep-a")).toBe(false);
        });

        it('should return false if not in shared list', () => {
            mockStorage["shared-externals"] = {"dep-a": [MOCK_VERSION()]};
            expect(externalsRepository.contains("dep-b")).toBe(false);
        });

        it('should return true if in shared list', () => {
            mockStorage["shared-externals"] = {"dep-a": [MOCK_VERSION()]};
            expect(externalsRepository.contains("dep-a")).toBe(true);
        });
    });

    describe('set', () => {
        it('should set the whole entry', () => {
            externalsRepository.set({"dep-a": [MOCK_VERSION()]});
            expect(mockStorage["shared-externals"]).toEqual({"dep-a": [MOCK_VERSION()]});
        });
        it('should clear the whole entry', () => {
            mockStorage["shared-externals"] = {"dep-a": [MOCK_VERSION()]};
            externalsRepository.set({});
            expect(mockStorage["shared-externals"]).toEqual({});
        });
        it('should replace the whole entry', () => {
            mockStorage["shared-externals"] = {"dep-a": [MOCK_VERSION()]};
            externalsRepository.set({"dep-b": []});
            expect(mockStorage["shared-externals"]).toEqual({"dep-b": []});
        });
    });

    describe('addOrUpdate', () => {
        it('should add a new external to empty storage', () => {
            const mockVersion = MOCK_VERSION();
            
            externalsRepository.addOrUpdate("dep-a", [mockVersion]);
            
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [mockVersion]
            });
        });
    
        it('should replace versions for an existing external', () => {
            const existingVersion = MOCK_VERSION();
            const newVersion = { ...MOCK_VERSION(), version: "2.0.0" };
            
            mockStorage["shared-externals"] = {"dep-a": [existingVersion]};
            
            externalsRepository.addOrUpdate("dep-a", [newVersion]);
            
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [newVersion]
            });
        });
    
        it('should keep other externals when adding a new one', () => {
            const versionA = MOCK_VERSION();
            const versionB = { ...MOCK_VERSION(), version: "4.5.6" };
            
            mockStorage["shared-externals"] = {"dep-a": [versionA]};
            
            externalsRepository.addOrUpdate("dep-b", [versionB]);
            
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [versionA],
                "dep-b": [versionB]
            });
        });
    
        it('should keep other externals when updating an existing one', () => {
            const versionA = MOCK_VERSION();
            const versionB = { ...MOCK_VERSION(), version: "4.5.6" };
            const newVersionA = { ...MOCK_VERSION(), version: "2.0.0" };
            
            mockStorage["shared-externals"] = {
                "dep-a": [versionA],
                "dep-b": [versionB]
            };
            
            externalsRepository.addOrUpdate("dep-a", [newVersionA]);
            
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [newVersionA],
                "dep-b": [versionB]
            });
        });
    
        it('should add multiple versions for the same external', () => {
            const version1 = MOCK_VERSION();
            const version2 = { ...MOCK_VERSION(), version: "2.0.0" };
            
            externalsRepository.addOrUpdate("dep-a", [version1, version2]);
            
            expect(mockStorage["shared-externals"]).toEqual({
                "dep-a": [version1, version2]
            });
        });
    
        it('should return the repository instance for chaining', () => {
            const result = externalsRepository.addOrUpdate("dep-a", [MOCK_VERSION()]);
            
            expect(result).toBe(externalsRepository);
        });
    });
});