import type { ExternalsScope } from '../../1.domain/externals/externals.contract';
import { createScopedExternalsRepository } from './scoped-externals.repository';
import { Optional } from '../../utils/optional';
import type { Version } from '../../1.domain/externals/version.contract';
import type { StorageConfig } from './storage.contract';
import type { ForStoringScopedExternals } from '../../2.app/driving-ports/for-storing-scoped-externals.port';
import { mockStorageEntry } from "../_mocks/storage/storage-entry.mock";


// TODO: migrate to setup fn instead of beforeEach
describe('createScopedExternalsRepository', () => {
    let mockStorageConfig: StorageConfig;
    let mockStorage: any;
    let externalsRepository: ForStoringScopedExternals;

    const MOCK_VERSION  = (): Version => ({
        version: "7.8.1", 
        url: "http://localhost:3001/shared-dep-A.js"
    });

    beforeEach(() => {
        mockStorage = {
            "scoped-externals": {
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            }
        };

        mockStorageConfig = mockStorageEntry(mockStorage);

        externalsRepository = createScopedExternalsRepository(mockStorageConfig);
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            expect(mockStorageConfig.toStorageEntry).toHaveBeenCalled();
            expect(mockStorage["scoped-externals"]).toEqual({
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            });
        });
    });

    describe('tryGetScope', () => {
        it('should return the scope', () => {
            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope-a");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual({"dep-a": MOCK_VERSION()});
        });

        it('should return empty optional if scope doesnt exist', () => {
            const actual: Optional<ExternalsScope> = externalsRepository.tryGetScope("scope-c");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

    describe('clearScope', () => {
        it('should not clear the specified scope if no commit', () => {

            externalsRepository.clearScope("scope-b");

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["scope-b"]).toEqual({"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()});
        });


        it('should clear the specified scope after commit', () => {

            externalsRepository.clearScope("scope-b");

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["scope-b"]).toEqual({"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()});

            externalsRepository.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["scope-b"]).toEqual({});
        });

        it('should handle clearing a non-existent scope', () => {
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": MOCK_VERSION()}
            };

            externalsRepository.clearScope("non-existent-scope");
            externalsRepository.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["non-existent-scope"]).toEqual({});
        });

        it('should return the repository instance for chaining', () => {
            const result = externalsRepository.clearScope("scope-a");
            expect(result).toBe(externalsRepository);
        });
    });

    describe('contains', () => {
        it('should return true when external exists in scope', () => {
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
        it('should not add external to an existing scope if no commit', () => {
            externalsRepository.addExternal("scope-a", "dep-b", MOCK_VERSION());

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});

        });

        it('should add external to an existing scope after commit', () => {

            externalsRepository.addExternal("scope-a", "dep-b", MOCK_VERSION());

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});

            externalsRepository.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({
                "dep-a": MOCK_VERSION(),
                "dep-b": MOCK_VERSION()
            });
        });

        it('should add external to a new scope', () => {
            mockStorage["scoped-externals"] = {};
            const version = MOCK_VERSION();

            externalsRepository.addExternal("new-scope", "dep-a", version);
            externalsRepository.commit();

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-a": version
            });
        });

        it('should add multiple externals to a new scope', () => {
            mockStorage["scoped-externals"] = {};
            const version = MOCK_VERSION();

            externalsRepository
                .addExternal("new-scope", "dep-a", version)
                .addExternal("new-scope", "dep-b", version);
            externalsRepository.commit();

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-a": version,
                "dep-b": version
            });
        });

        it('should overwrite an existing external in a scope', () => {
            const oldVersion = MOCK_VERSION();
            const newVersion = { ...MOCK_VERSION(), version: "8.0.0" };
            
            mockStorage["scoped-externals"] = {
                "scope-a": {"dep-a": oldVersion}
            };

            externalsRepository.addExternal("scope-a", "dep-a", newVersion);
            externalsRepository.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]["dep-a"]).toEqual(newVersion);
            expect(mockStorage["scoped-externals"]["scope-a"]["dep-a"]).not.toEqual(oldVersion);
        });

        it('should return the repository instance for chaining', () => {
            const result = externalsRepository.addExternal("scope-a", "dep-a", MOCK_VERSION());
            expect(result).toBe(externalsRepository);
        });
    });
});