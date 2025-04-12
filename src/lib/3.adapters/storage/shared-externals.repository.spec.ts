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

});