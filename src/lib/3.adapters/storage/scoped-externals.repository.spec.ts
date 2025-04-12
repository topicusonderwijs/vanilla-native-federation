import type { ExternalsScope } from '../../1.domain/externals/externals.contract';
import { createScopedExternalsRepository } from './scoped-externals.repository';
import { Optional } from '../../utils/optional';
import type { Version } from '../../1.domain/externals/version.contract';
import type { StorageEntry, StorageConfig } from './storage.contract';
import type { ForStoringScopedExternals } from '../../2.app/driving-ports/for-storing-scoped-externals.port';

describe('createScopedExternalsRepository', () => {
    let mockStorageConfig: StorageConfig;
    let mockStorage: any;
    let externalsRepository: ForStoringScopedExternals;

    const MOCK_VERSION  = (): Version => ({
        version: "7.8.1", 
        url: "http://localhost:3001/shared-dep-A.js"
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

        externalsRepository = createScopedExternalsRepository(mockStorageConfig);
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            expect(mockStorageConfig.toStorageEntry).toHaveBeenCalled();
            expect(mockStorage["scoped-externals"]).toEqual({ });
        });
    });

    describe('tryGetScope', () => {
        it('should return the scope', () => {
            mockStorage["scoped-externals"]["scope"] = {"dep-a": MOCK_VERSION()};

            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual({"dep-a": MOCK_VERSION()});
        });

        it('should return empty optional if scope doesnt exist', () => {
            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });

        it('should return empty optional if only other scopes exist', () => {
            mockStorage["scoped-externals"]["scope-a"] = {"dep-a": MOCK_VERSION()};

            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope-b");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

    describe('clearScope', () => {
        it('should clear the specified scope', () => {
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            };

            const result = externalsRepository.clearScope("scope-b");

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["scope-b"]).toEqual({});
            expect(result).toBe(externalsRepository); // Returns itself for method chaining
        });

        it('should handle clearing a non-existent scope', () => {
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": MOCK_VERSION()}
            };

            const result = externalsRepository.clearScope("non-existent-scope");

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["non-existent-scope"]).toEqual({});
            expect(result).toBe(externalsRepository);
        });
    });

    describe('contains', () => {
        it('should return true when external exists in scope', () => {
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": MOCK_VERSION(), "dep-b": MOCK_VERSION()}
            };

            const result = externalsRepository.contains("scope-a", "dep-a");

            expect(result).toBe(true);
        });

        it('should return false when external does not exist in scope', () => {
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": MOCK_VERSION()}
            };

            const result = externalsRepository.contains("scope-a", "dep-b");

            expect(result).toBe(false);
        });

        it('should return false when scope does not exist', () => {
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": MOCK_VERSION()}
            };

            const result = externalsRepository.contains("non-existent-scope", "dep-a");

            expect(result).toBe(false);
        });
    });

    describe('addExternal', () => {
        it('should add external to an existing scope', () => {
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": MOCK_VERSION()}
            };
            const version = MOCK_VERSION();

            const result = externalsRepository.addExternal("scope-a", "dep-b", version);

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({
                "dep-a": MOCK_VERSION(),
                "dep-b": version
            });
            expect(result).toBe(externalsRepository);
        });

        it('should add external to a new scope', () => {
            mockStorage["scoped-externals"] = {};
            const version = MOCK_VERSION();

            const result = externalsRepository.addExternal("new-scope", "dep-a", version);

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-a": version
            });
            expect(result).toBe(externalsRepository);
        });

        it('should add multiple externals to a new scope', () => {
            mockStorage["scoped-externals"] = {};
            const version = MOCK_VERSION();

            const result = externalsRepository
                .addExternal("new-scope", "dep-a", version)
                .addExternal("new-scope", "dep-b", version);

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-a": version,
                "dep-b": version
            });
            expect(result).toBe(externalsRepository);
        });

        it('should overwrite an existing external in a scope', () => {
            const oldVersion = MOCK_VERSION();
            const newVersion = { ...MOCK_VERSION(), version: "8.0.0" };
            
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": oldVersion}
            };

            const result = externalsRepository.addExternal("scope-a", "dep-a", newVersion);

            expect(mockStorage["scoped-externals"]["scope-a"]["dep-a"]).toEqual(newVersion);
            expect(mockStorage["scoped-externals"]["scope-a"]["dep-a"]).not.toEqual(oldVersion);
            expect(result).toBe(externalsRepository);
        });
    });
});