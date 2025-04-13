import type { ExternalsScope } from '../../1.domain/externals/externals.contract';
import { createScopedExternalsRepository } from './scoped-externals.repository';
import { Optional } from '../../utils/optional';
import type { Version } from '../../1.domain/externals/version.contract';
import { mockStorageEntry } from "../_mocks/storage/storage-entry.mock";

describe('createScopedExternalsRepository', () => {

    const setupWithCache = ((storage: any) => {
        const mockStorage = {"scoped-externals": storage};
        const mockStorageConfig = mockStorageEntry(mockStorage);
        const externalsRepo = createScopedExternalsRepository(mockStorageConfig);
        return {mockStorage, externalsRepo};
    });

    const MOCK_VERSION  = (): Version => ({
        version: "7.8.1", 
        url: "http://localhost:3001/shared-dep-A.js"
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            const {mockStorage} = setupWithCache(undefined);
            expect(mockStorage["scoped-externals"]).toEqual({});
        });
    });

    describe('tryGetScope', () => {
        it('should return the scope', () => {
            const {externalsRepo} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()}
            });

            const actual: Optional<ExternalsScope> = externalsRepo.tryGetScope("scope-a");

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual({"dep-a": MOCK_VERSION()});
        });

        it('should return empty optional if scope doesnt exist', () => {
            const {externalsRepo} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()}
            });

            const actual: Optional<ExternalsScope> = externalsRepo.tryGetScope("scope-b");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

    describe('clearScope', () => {
        it('should not clear the specified scope if no commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            });
            externalsRepo.clearScope("scope-b");

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["scope-b"]).toEqual({"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()});
        });


        it('should clear the specified scope after commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            });
            externalsRepo.clearScope("scope-b");

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["scope-b"]).toEqual({"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()});

            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["scope-b"]).toEqual({});
        });

        it('should handle clearing a non-existent scope', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            });

            externalsRepo.clearScope("non-existent-scope");
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});
            expect(mockStorage["scoped-externals"]["non-existent-scope"]).toEqual({});
        });

        it('should return the repository instance for chaining', () => {
            const {externalsRepo} = setupWithCache({});
            const result = externalsRepo.clearScope("scope-a");
            expect(result).toBe(externalsRepo);
        });
    });

    describe('contains', () => {
        it('should return true when external exists in scope', () => {
            const {externalsRepo} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            });
            const result = externalsRepo.contains("scope-a", "dep-a");

            expect(result).toBe(true);
        });

        it('should return false when external does not exist in scope', () => {
            const {externalsRepo} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            });
            const result = externalsRepo.contains("scope-a", "dep-b");

            expect(result).toBe(false);
        });

        it('should return false when scope does not exist', () => {
            const {externalsRepo} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
                "scope-b": {"dep-b": MOCK_VERSION(), "dep-c": MOCK_VERSION()}
            });

            const result = externalsRepo.contains("non-existent-scope", "dep-a");

            expect(result).toBe(false);
        });
    });

    describe('addExternal', () => {
        it('should not add external to an existing scope if no commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
            });
            externalsRepo.addExternal("scope-a", "dep-b", MOCK_VERSION());

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});

        });

        it('should add external to an existing scope after commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
            });
            externalsRepo.addExternal("scope-a", "dep-b", MOCK_VERSION());

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({"dep-a": MOCK_VERSION()});

            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]).toEqual({
                "dep-a": MOCK_VERSION(),
                "dep-b": MOCK_VERSION()
            });
        });

        it('should add external to a new scope', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
            });
            const version = MOCK_VERSION();

            externalsRepo.addExternal("new-scope", "dep-b", version);
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-b": version
            });
        });

        it('should add multiple externals to a new scope', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": MOCK_VERSION()},
            });

            externalsRepo
                .addExternal("new-scope", "dep-a", MOCK_VERSION())
                .addExternal("new-scope", "dep-b", MOCK_VERSION());
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-a": MOCK_VERSION(),
                "dep-b": MOCK_VERSION()
            });
        });

        it('should overwrite an existing external in a scope', () => {
            const oldVersion = MOCK_VERSION();
            const newVersion = { ...MOCK_VERSION(), version: "8.0.0" };
            const {externalsRepo, mockStorage} = setupWithCache({
                "scope-a": {"dep-a": oldVersion}
            });

            externalsRepo.addExternal("scope-a", "dep-a", newVersion);
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["scope-a"]["dep-a"]).toEqual(newVersion);
            expect(mockStorage["scoped-externals"]["scope-a"]["dep-a"]).not.toEqual(oldVersion);
        });

        it('should return the repository instance for chaining', () => {
            const {externalsRepo} = setupWithCache({});
            const result = externalsRepo.addExternal("scope-a", "dep-a", MOCK_VERSION());
            expect(result).toBe(externalsRepo);
        });
    });
});