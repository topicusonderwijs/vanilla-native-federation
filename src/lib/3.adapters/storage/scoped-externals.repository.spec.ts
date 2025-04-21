import type { ExternalsScope } from 'lib/1.domain/externals/external.contract';
import { createScopedExternalsRepository } from './scoped-externals.repository';
import { Optional } from 'lib/utils/optional';
import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { MOCK_EXTERNALS_SCOPE } from 'lib/6.mocks/domain/externals/external.mock';
import { MOCK_REMOTE_ENTRY_SCOPE_I_URL } from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { Version } from 'lib/1.domain/externals/version.contract';
import { MOCK_VERSION_I } from 'lib/6.mocks/domain/externals/version.mock';

describe('createScopedExternalsRepository', () => {

    const setupWithCache = ((storage: any) => {
        const mockStorage = {"scoped-externals": storage};
        const mockStorageEntry = createStorageHandlerMock(mockStorage);
        const externalsRepo = createScopedExternalsRepository({storage: mockStorageEntry, clearCache: false});
        return {mockStorage, externalsRepo};
    });

    describe('initialization', () => {
        it('should initialize the entry with the first value', () => {
            const {mockStorage} = setupWithCache(undefined);
            expect(mockStorage["scoped-externals"]).toEqual({});
        });

        it('should reset cache when in config', () => {
            const mockStorage = {"scoped-externals": {
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            }};
            const mockStorageEntry = createStorageHandlerMock(mockStorage);
            createScopedExternalsRepository({storage: mockStorageEntry, clearCache: true});
            expect(mockStorage["scoped-externals"]).toEqual({});
        });
    });

    describe('tryGetScope', () => {
        it('should return the scope', () => {
            const {externalsRepo} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });

            const actual: Optional<ExternalsScope> = externalsRepo.tryGetScope(MOCK_REMOTE_ENTRY_SCOPE_I_URL());

            expect(actual.isPresent()).toBe(true);
            expect(actual.get()).toEqual(MOCK_EXTERNALS_SCOPE());
        });

        it('should return empty optional if scope doesnt exist', () => {
            const {externalsRepo} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });

            const actual: Optional<ExternalsScope> = externalsRepo.tryGetScope("non-existing-scope");

            expect(actual.isPresent()).toBe(false);
            expect(actual.get()).toEqual(undefined);
        });
    });

    describe('clearScope', () => {
        it('should not clear the specified scope if no commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });

            externalsRepo.clearScope(MOCK_REMOTE_ENTRY_SCOPE_I_URL());

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual(MOCK_EXTERNALS_SCOPE());
        });


        it('should clear the specified scope after commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });

            externalsRepo.clearScope(MOCK_REMOTE_ENTRY_SCOPE_I_URL());

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual(MOCK_EXTERNALS_SCOPE());

            externalsRepo.commit();

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual({});
        });

        it('should only clear the specified scope', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE(),
                ["other-scope"]: MOCK_EXTERNALS_SCOPE()
            });

            externalsRepo.clearScope(MOCK_REMOTE_ENTRY_SCOPE_I_URL());

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual(MOCK_EXTERNALS_SCOPE());
            expect(mockStorage["scoped-externals"]["other-scope"]).toEqual(MOCK_EXTERNALS_SCOPE());


            externalsRepo.commit();

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual({});
            expect(mockStorage["scoped-externals"]["other-scope"]).toEqual(MOCK_EXTERNALS_SCOPE());
        });

        it('should handle clearing a non-existent scope', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });

            externalsRepo.clearScope("non-existent-scope");
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual(MOCK_EXTERNALS_SCOPE());
        });

        it('should return the repository instance for chaining', () => {
            const {externalsRepo} = setupWithCache({});
            const result = externalsRepo.clearScope(MOCK_REMOTE_ENTRY_SCOPE_I_URL());
            expect(result).toBe(externalsRepo);
        });
    });

    describe('contains', () => {
        it('should return true when external exists in scope', () => {
            const {externalsRepo} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });
            const result = externalsRepo.contains(MOCK_REMOTE_ENTRY_SCOPE_I_URL(), "dep-a");

            expect(result).toBe(true);
        });

        it('should return false when external does not exist in scope', () => {
            const {externalsRepo} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });
            const result = externalsRepo.contains(MOCK_REMOTE_ENTRY_SCOPE_I_URL(), "dep-b");

            expect(result).toBe(false);
        });

        it('should return false when scope does not exist', () => {
            const {externalsRepo} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });

            const result = externalsRepo.contains("non-existent-scope", "dep-a");

            expect(result).toBe(false);
        });
    });

    describe('addExternal', () => {
        it('should not add external to scope if no commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: {}
            });
            const newVersion = (): Version => ({
                version: "9.9.9",
                file: "dep-x.js"
            });

            externalsRepo.addExternal(MOCK_REMOTE_ENTRY_SCOPE_I_URL(), "dep-x", newVersion());

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual({});
        });

        it('should add external to scope after commit', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: {}
            });
            const newVersion = (): Version => ({
                version: "9.9.9",
                file: "dep-x.js"
            });

            externalsRepo.addExternal(MOCK_REMOTE_ENTRY_SCOPE_I_URL(), "dep-x", newVersion());

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual({});

            externalsRepo.commit();

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]).toEqual({
                "dep-x": newVersion()
            });
        });

        it('should add external to a new scope', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });
            const newVersion = (): Version => ({
                version: "9.9.9",
                file: "dep-x.js"
            });

            externalsRepo.addExternal("new-scope", "dep-x", newVersion());
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-x": newVersion()
            });
        });

        it('should add multiple externals to a new scope', () => {
            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });
            const newVersionI = (): Version => ({
                version: "8.8.8",
                file: "dep-a.js"
            });
            const newVersionII = (): Version => ({
                version: "9.9.9",
                file: "dep-b.js"
            });

            externalsRepo
                .addExternal("new-scope", "dep-a", newVersionI())
                .addExternal("new-scope", "dep-b", newVersionII());
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"]["new-scope"]).toEqual({
                "dep-a": newVersionI(),
                "dep-b": newVersionII()
            });
        });

        it('should overwrite an existing external in a scope', () => {
            const newVersion = (): Version => ({
                version: "8.8.8",
                file: "new-dep-a.js"
            });

            const {externalsRepo, mockStorage} = setupWithCache({
                [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: MOCK_EXTERNALS_SCOPE()
            });

            externalsRepo.addExternal(MOCK_REMOTE_ENTRY_SCOPE_I_URL(), "dep-a", newVersion());
            externalsRepo.commit();

            expect(mockStorage["scoped-externals"][MOCK_REMOTE_ENTRY_SCOPE_I_URL()]["dep-a"]).toEqual(newVersion());
        });

        it('should return the repository instance for chaining', () => {
            const {externalsRepo} = setupWithCache({});
            const result = externalsRepo.addExternal("scope-a", "dep-a", MOCK_VERSION_I());
            expect(result).toBe(externalsRepo);
        });
    });
});