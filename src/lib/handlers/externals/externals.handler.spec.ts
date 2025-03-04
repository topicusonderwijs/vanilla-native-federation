import { externalsHandlerFactory } from './externals.handler';
import { ExternalsHandler, SharedInfo } from './externals.contract';
import { mockLogHandler, mockStorageHandler, mockVersionHandler } from '../../../mock/handlers.mock';
import { NfCache, StorageHandler } from '../storage/storage.contract';
import { Version, VersionHandler } from '../version/version.contract';
import { LogHandler } from '../logging';

/**
 * SharedInfo = meta info regarding a shared dependency.
 * 
 * Externals are preserved in storage and represent the cached dependencies and their versions internally. 
 * The final ImportMap is build from the stored dependencies. 
 */
describe('externalsHandler', () => {
    let storageHandler: StorageHandler<NfCache>;
    let versionHandler: VersionHandler;
    let logHandler: LogHandler;
    let externalsHandler: ExternalsHandler;

    type CacheGlobalExternals = {global: Record<string, Version>};
    type CacheScopedExternals = Record<string, Record<string, Version>>;

    const MOCK_SHARED_INFO = ({singleton, strictVersion}: {singleton: boolean, strictVersion: boolean}) => ([
        {
            packageName: "rxjs",
            outFileName: "rxjs.js",
            requiredVersion: "~7.8.0",
            singleton,
            strictVersion,
            version: "7.8.1",
        },
    ] as SharedInfo[]);

    const MOCK_SCOPE = () => "http://localhost:3001/";

    beforeEach(() => {
        storageHandler = mockStorageHandler();
        versionHandler = mockVersionHandler();
        logHandler = mockLogHandler();
        externalsHandler = externalsHandlerFactory(
            storageHandler,
            logHandler,
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
                        "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/cached-rxjs.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.fromStorage(SCOPE);

            expect(actual).toEqual({
                "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/cached-rxjs.js"}
            });
        });

        it('should return the cached global scope of deps', () => {
            const SCOPE = MOCK_SCOPE(); 

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/cached-rxjs.js"}
                    },
                    [SCOPE]: {}
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.fromStorage("global");

            expect(actual).toEqual({
                "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/cached-rxjs.js"}
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

        beforeEach(() => {
            versionHandler.toRange = jest.fn((version) => {
                if(version === "~7.8.0") return ["7.8.0","7.9.0"];
                if(version === "~2.8.0") return ["2.8.0","2.9.0"];
                throw new Error(`Provided range '${version}' is not mocked`);
            })
            versionHandler.getSmallestVersionRange = jest.fn((): [string,string] => {

                return ["7.8.0","7.9.0"];
            })
        })

        it('should add externals of RemoteInfo to global scope', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true, strictVersion: false});

            let actual = {global: {}} as CacheGlobalExternals & CacheScopedExternals

            const expected = {
                global: {
                    "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }
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
            const sharedInfo = MOCK_SHARED_INFO({singleton: false, strictVersion: false});

            let actual = {global: {}} as CacheGlobalExternals & CacheScopedExternals

            const expected = {
                global: {},
                [SCOPE]: {
                    "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }
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

        it('should update requiredVersion if version is smaller than current', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true, strictVersion: false});

            let actual = {
                global: {"rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }},
                [SCOPE]: { }
            } as CacheGlobalExternals & CacheScopedExternals

            versionHandler.compareVersions = jest.fn((v1, v2) => {
                if (v1 === '7.8.1' && v2 === '7.8.1') return 0;
                return 0;
            });

            

            externalsHandler.toStorage(sharedInfo, SCOPE);

            // 1) REMOVE OLD DEPS FROM SCOPE IN STORAGE
            let [storageEntry1, clearScopeFn] = (storageHandler.update as any).mock.calls[0];
            actual = clearScopeFn(actual);
            expect(storageEntry1).toBe("externals");
            expect(actual).toEqual({
                global: {"rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }},
                [SCOPE]: { }
            });

            // 2) ADD DEPS TO GLOBAL AND SCOPE
            let [storageEntry2, addExternalsFn] = (storageHandler.update as any).mock.calls[1];
            actual = addExternalsFn(actual);
            expect(actual).toEqual({
                global: {"rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }},
                [SCOPE]: { }
            });
            expect(storageEntry2).toBe("externals");
        });  
        
        it('should append new externals to cache', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true, strictVersion: false});

            const cache = {
                externals: {
                    global: {
                        "rxjs/operators": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs_operators.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            externalsHandler.toStorage(sharedInfo, SCOPE);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual({
                global: {
                    "rxjs/operators": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs_operators.js"},
                    "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }
                }
            });
        });

        it('should append new strict externals to cache', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true, strictVersion: true});

            const cache = {
                externals: {
                    global: {
                        "rxjs/operators": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs_operators.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            externalsHandler.toStorage(sharedInfo, SCOPE);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual({
                global: {
                    "rxjs/operators": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs_operators.js"},
                    "rxjs": {version: "7.8.1", strictRequiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }
                }
            });
        });

        it('should override if the version is newer', () => {
            const SCOPE = MOCK_SCOPE(); 
            const sharedInfo = MOCK_SHARED_INFO({singleton: true, strictVersion: false});

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.0", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/OLD-PACKAGE.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            versionHandler.compareVersions = jest.fn((v1, v2) => {
                if (v1 === '7.8.0' && v2 === '7.8.1') return -1;
                if (v1 === '~7.8.0' && v2 === '~7.8.0') return 0;
                return 0;
            });

            externalsHandler.toStorage(sharedInfo, SCOPE);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual({
                global: {
                    "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/rxjs.js" }
                }
            });
        });

        it('should not override if the version is equal', () => {
            const scopeUrl = "http://localhost:3001/";
            const sharedInfo = MOCK_SHARED_INFO({singleton: true, strictVersion: false});

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/OLD-PACKAGE.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            const expected = {
                global: {
                    "rxjs": {version: "7.8.1", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/OLD-PACKAGE.js" }
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
            const sharedInfo = MOCK_SHARED_INFO({singleton: true, strictVersion: false});

            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.2", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/NEW-PACKAGE.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            }

            versionHandler.compareVersions = jest.fn((v1, v2) => {
                if (v1 === '7.8.2' && v2 === '7.8.1') return 1;
                if (v1 === '~7.8.0' && v2 === '~7.8.0') return 0;
                return 0;
            });

            externalsHandler.toStorage(sharedInfo, SCOPE);

            const [key, mutation] = (storageHandler.update as any).mock.calls[1];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual({
                global: {
                    "rxjs": {version: "7.8.2", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/NEW-PACKAGE.js" }
                }
            });
        });
    });

    describe('checkForIncompatibleSingletons', () => {
        beforeEach(() => {
            (versionHandler.toRange as jest.Mock) = jest.fn(() => ["7.8.0","7.9.0"]);
        });

        it('should do nothing if all versions are compatible', () => {
            (storageHandler.fetch as jest.Mock) = jest.fn((): {global: Record<string, Version>} => ({
                global: {
                    "rxjs": {version: "7.8.2", requiredVersion: ["7.8.0","7.9.0"], url: "http://localhost:3001/NEW-PACKAGE.js" }
                }
            }));
            (versionHandler.isCompatible as jest.Mock) = jest.fn(() => true);

            externalsHandler.checkForIncompatibleSingletons(MOCK_SHARED_INFO({singleton: true, strictVersion: false}))
            expect(logHandler.warn).not.toHaveBeenCalled();
        })

        it('to send warning if new singleton is outside of range', () => {
            (storageHandler.fetch as jest.Mock) = jest.fn((): {global: Record<string, Version>} => ({
                global: {
                    "rxjs": {version: "7.6.2", requiredVersion: ["7.6.0","7.7.0"], url: "http://localhost:3001/NEW-PACKAGE.js" }
                }
            }));
            (versionHandler.isCompatible as jest.Mock) = jest.fn(() => false);

            externalsHandler.checkForIncompatibleSingletons(MOCK_SHARED_INFO({singleton: true, strictVersion: false}));

            expect((logHandler.warn as jest.Mock).mock.calls).toEqual([
                ["[rxjs] Version '7.8.1' is not compatible to version range '7.6.0 - 7.7.0'"],
                ["[rxjs] Stored version '7.6.2' is not compatible to version range '7.8.0 - 7.9.0'"]
            ]);
        });

        it('to send an error if new singleton is outside of range', () => {
            (storageHandler.fetch as jest.Mock) = jest.fn((): {global: Record<string, Version>} => ({
                global: {
                    "rxjs": {version: "7.6.2", strictRequiredVersion: ["7.6.0","7.7.0"], url: "http://localhost:3001/NEW-PACKAGE.js" }
                }
            }));
            (versionHandler.isCompatible as jest.Mock) = jest.fn(() => false);

            const actual = () => externalsHandler.checkForIncompatibleSingletons(MOCK_SHARED_INFO({singleton: true, strictVersion: false}));

            expect(actual).toThrow("[rxjs] Version '7.8.1' is not compatible to version range '7.6.0 - 7.7.0'");
        });

        it('to send the current stored version is outside of new singleton range', () => {
            (storageHandler.fetch as jest.Mock) = jest.fn((): {global: Record<string, Version>} => ({
                global: {
                    "rxjs": {version: "8.1.2", requiredVersion: ["7.1.0","8.2.0"], url: "http://localhost:3001/NEW-PACKAGE.js" }
                }
            }));
            (versionHandler.isCompatible as jest.Mock) = jest.fn(() => false);

            const actual = () => externalsHandler.checkForIncompatibleSingletons(MOCK_SHARED_INFO({singleton: true, strictVersion: true}));

            expect(actual).toThrow("[rxjs] Stored version '8.1.2' is not compatible to version range '7.8.0 - 7.9.0'");
        });
    })
});
