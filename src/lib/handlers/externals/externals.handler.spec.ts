import { externalsHandlerFactory } from './externals.handler';
import { ExternalsHandler, SharedInfo } from './externals.contract';
import { mockStorageHandler, mockVersionHandler } from '../../../mock/handlers.mock';
import { NfCache, StorageHandler } from '../storage/storage.contract';
import { VersionHandler } from '../version/version.contract';
import { Remote } from '../remote-info/remote-info.contract';

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

    const REMOTE_MFE1_MOCK: (opt: {singleton: boolean}) => Remote = ({singleton}) => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe1', 
            shared: [
                {
                    packageName: "rxjs",
                    outFileName: "rxjs.js",
                    requiredVersion: "~7.8.0",
                    singleton,
                    strictVersion: true,
                    version: "7.8.1",
                },
            ] as SharedInfo[], 
            exposes: [{key: './comp', outFileName: 'comp.js'}], 
            baseUrl: 'http://localhost:3001'
        }))

    beforeEach(() => {
        storageHandler = mockStorageHandler();
        versionHandler = mockVersionHandler();
        externalsHandler = externalsHandlerFactory(
            {builderType: "default"},
            storageHandler,
            versionHandler
        );
    });

    describe('toScope', () => {
        it("should suffix a '/' to the scope", () => {
            const expected = "http://localhost:3001/";
            const actual = externalsHandler.toScope('http://localhost:3001')
            expect(actual).toEqual(expected);
        });
        it("should not alter the global scope", () => {
            const expected = "global";
            const actual = externalsHandler.toScope('global')
            expect(actual).toEqual(expected);
        });
    });

    describe('getFromScope', () => {

        it('should return the cached scope of deps', () => {
            const cache = {
                externals: {
                    global: {},
                    "http://localhost:3001/": {
                        "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
                    }
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.getFromScope("http://localhost:3001");

            expect(actual).toEqual({
                "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
            });
        });

        it('should return the cached global scope of deps', () => {
            const cache = {
                externals: {
                    global: {
                        "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
                    },
                    "http://localhost:3001/": {}
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.getFromScope("global");

            expect(actual).toEqual({
                "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/cached-rxjs.js"}
            });
        });

        it('should return an empty map if the scope doesn\'t exist', () => {
            const cache = {
                externals: {
                    global: {},
                } as CacheGlobalExternals & CacheScopedExternals
            };

            (storageHandler.fetch as jest.Mock).mockReturnValue(cache.externals);

            const actual = externalsHandler.getFromScope("http://localhost:3001");

            expect(actual).toEqual({});
        });
    });

    describe('addToStorage', () => {
        it('should add externals of RemoteInfo to global storage', () => {
            const remote = REMOTE_MFE1_MOCK({singleton: true});
            const cache = {externals: {global: {}} as CacheGlobalExternals & CacheScopedExternals}

            const expected = {
                global: {
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js" }
                },
            }

            externalsHandler.addToStorage(remote);

            const [entry, mutation] = (storageHandler.update as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(entry).toBe("externals");
            expect(actual).toEqual(expected);
        });  

        it('should add externals of RemoteInfo to scoped storage', () => {
            const remote = REMOTE_MFE1_MOCK({singleton: false});
            const cache = {externals: {global: {}} as CacheGlobalExternals & CacheScopedExternals}

            const expected = {
                global: {},
                "http://localhost:3001/": {
                    "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js" }
                }
            }

            externalsHandler.addToStorage(remote);

            const [key, mutation] = (storageHandler.update as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });  
        
        it('should append new externals to cache', () => {
            const remote = REMOTE_MFE1_MOCK({singleton: true});
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

            externalsHandler.addToStorage(remote);

            const [key, mutation] = (storageHandler.update as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should override if the version is newer', () => {
            const remote = REMOTE_MFE1_MOCK({singleton: true});
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

            externalsHandler.addToStorage(remote);

            const [key, mutation] = (storageHandler.update as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should not override if the version is equal', () => {
            const remote = REMOTE_MFE1_MOCK({singleton: true});
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

            externalsHandler.addToStorage(remote);

            const [key, mutation] = (storageHandler.update as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });

        it('should not override if the version is older', () => {
            const remote = REMOTE_MFE1_MOCK({singleton: true});
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

            externalsHandler.addToStorage(remote);

            const [key, mutation] = (storageHandler.update as any).mock.calls[0];
            const actual = mutation(cache.externals);

            expect(key).toBe("externals");
            expect(actual).toEqual(expected);
        });
    });
});