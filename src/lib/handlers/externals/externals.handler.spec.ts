import { externalsHandlerFactory } from './externals.handler';
import { ExternalsHandler, SharedInfo } from './externals.contract';
import { mockStorageHandler, mockVersionHandler } from '../../../mock/handlers.mock';
import { NfCache, StorageHandler } from '../storage/storage.contract';
import { VersionHandler } from '../version/version.contract';

/**
 * SharedInfo = meta info regarding a shared dependency.
 * 
 * Externals are preserved in storage and represent the cached dependencies and their versions internally. 
 * The final ImportMap is build from the stored dependencies. 
 */
describe('externalsHandler', () => {
    let storageHandler: StorageHandler<NfCache>;
    let versionHandler: VersionHandler;
    let externalsHandler: ExternalsHandler;

    type CacheGlobalExternals = {global: Record<string, {version: string,requiredVersion: string, url: string}>};
    type CacheScopedExternals = Record<string, Record<string, {version: string,requiredVersion: string, url: string}>>;

    const MOCK_SHARED_INFO = ({singleton}: {singleton: boolean}) => ([
        {
            packageName: "rxjs",
            outFileName: "rxjs.js",
            requiredVersion: "~7.8.0",
            singleton,
            strictVersion: true,
            version: "7.8.1",
        },
    ] as SharedInfo[]);

    const MOCK_SCOPE = () => "http://localhost:3001/";

    beforeEach(() => {
        storageHandler = mockStorageHandler();
        versionHandler = mockVersionHandler();
        externalsHandler = externalsHandlerFactory(
            {builderType: "default"},
            storageHandler,
            versionHandler
        );
    });

    describe('getFromScope', () => {

        it('should return the cached scope of deps', () => {
            const SCOPE = MOCK_SCOPE(); 

            const cache = {
                externals: {
                    global: {},
                    [SCOPE]: {
                        "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.fromStorage(SCOPE);

            expect(actual).toEqual({
                "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
            });
        });

        it('should return the cached global scope of deps', () => {
            const SCOPE = MOCK_SCOPE(); 

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
                    },
                    [SCOPE]: {}
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.fromStorage("global");

            expect(actual).toEqual({
                "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
            });
        });

        it('should return an empty map if the scope doesn\'t exist', () => {
            const SCOPE = MOCK_SCOPE(); 

            const cache = {
                externals: {
                    global: {},
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.fromStorage(SCOPE);

            expect(actual).toEqual({});
        });
    });

    describe('toStorage', () => {
        it('should add externals of RemoteInfo to global scope', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true});

            let actual = {global: {}} as CacheGlobalExternals & CacheScopedExternals

            const expected = {
                global: {
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js" }
                },
                [SCOPE]: {}
            }

            externalsHandler.toStorage(sharedInfo, SCOPE);

            // 1) REMOVE OLD DEPS FROM SCOPE IN STORAGE
            let [storageEntry1, clearScopeFn] = (storageHandler.update as any).mock.calls[0];
            actual = clearScopeFn(actual);
            expect(storageEntry1).toBe("externals");
            expect(actual).toEqual({global: {}, [SCOPE]: {}});

            // 2) ADD DEPS TO GLOBAL AND REMOTE SCOPE
            let [storageEntry2, addExternalsFn] = (storageHandler.update as any).mock.calls[1];
            actual = addExternalsFn(actual);
            expect(actual).toEqual(expected);
            expect(storageEntry2).toBe("externals");
        });  

        it('should add externals of RemoteInfo to scoped storage', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: false});

            let actual = {global: {}} as CacheGlobalExternals & CacheScopedExternals

            const expected = {
                global: {},
                [SCOPE]: {
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js" }
                }
            }

            externalsHandler.toStorage(sharedInfo, SCOPE);

            // 1) REMOVE OLD DEPS FROM SCOPE IN STORAGE
            let [storageEntry1, clearScopeFn] = (storageHandler.update as any).mock.calls[0];
            actual = clearScopeFn(actual);
            expect(storageEntry1).toBe("externals");
            expect(actual).toEqual({global: {}, [SCOPE]: {}});

            // 2) ADD DEPS TO GLOBAL AND SCOPE
            let [storageEntry2, addExternalsFn] = (storageHandler.update as any).mock.calls[1];
            actual = addExternalsFn(actual);
            expect(actual).toEqual(expected);
            expect(storageEntry2).toBe("externals");
        });  
        
        it('should append new externals to cache', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true});

            const cache = {
                externals: {
                    global: {
                        "rxjs/operators": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs_operators.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            const expected = {
                global: {
                    "rxjs/operators": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs_operators.js"},
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js" }
                }
            }

            externalsHandler.toStorage(sharedInfo, SCOPE);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should override if the version is newer', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true});

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.0", requiredVersion: "~7.8.0", url: "http://localhost:3001/OLD-PACKAGE.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            const expected = {
                global: {
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js" }
                }
            };

            (versionHandler.compareVersions as jest.Mock).mockReturnValue(1); // version is higher than cached

            externalsHandler.toStorage(sharedInfo, SCOPE);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should not override if the version is equal', () => {
            const scopeUrl = "http://localhost:3001/";
            const sharedInfo = MOCK_SHARED_INFO({singleton: true});

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/OLD-PACKAGE.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            const expected = {
                global: {
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/OLD-PACKAGE.js" }
                }
            };

            (versionHandler.compareVersions as jest.Mock).mockReturnValue(0); // version is equal to cached

            externalsHandler.toStorage(sharedInfo, scopeUrl);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should not override if the version is older', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true});

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.2", requiredVersion: "~7.8.0", url: "http://localhost:3001/NEW-PACKAGE.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            const expected = {
                global: {
                    "rxjs": {version: "7.8.2", requiredVersion: "~7.8.0", url: "http://localhost:3001/NEW-PACKAGE.js" }
                }
            };

            (versionHandler.compareVersions as jest.Mock).mockReturnValue(-1); // version is older than cached

            externalsHandler.toStorage(sharedInfo, SCOPE);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });
    });
});