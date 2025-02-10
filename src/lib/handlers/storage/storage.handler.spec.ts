import { mockStorageEntry } from "../../../mock/storage.mock";
import { RemoteInfo } from "../remote-info";
import { NfCache, StorageHandler, StorageOf } from "./storage.contract";
import { storageHandlerFactory } from "./storage.handler";

describe('storageHandler', () => {

    let storage: NfCache;
    let storageHandler: StorageHandler<NfCache>;

    const MOCK_REMOTE_INFO = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3001/",
        remoteName: "team/mfe1",
        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
    });

    const MOCK_REMOTE_INFO_II = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3002/",
        remoteName: "team/mfe2",
        exposes: [{moduleName: "./comp", url: "http://localhost:3002/comp.js"}]
    });

    const MOCK_REMOTE_INFO_III = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3003/",
        remoteName: "team/mfe3",
        exposes: [{moduleName: "./comp", url: "http://localhost:3003/comp.js"}]
    });

    beforeEach(() => {
        storage = {
            externals: {
                global: {"rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url: "http://localhost:3001/rxjs.js"} }
            },
            remotes: { "team/mfe1": MOCK_REMOTE_INFO() },
        };
        storageHandler = storageHandlerFactory({cache: storage, toStorageEntry: mockStorageEntry});
    });

    describe('entry', () => {
        it('should get the initial values', () => {            
            expect(storageHandler.entry("externals").get()).toEqual(
                {global: {"rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url:"http://localhost:3001/rxjs.js"}}}
            );
            expect(storageHandler.entry("remotes").get()).toEqual(
                { "team/mfe1": MOCK_REMOTE_INFO() }
            );
        });
    });

    describe('fetch', () => {
        it('should get the value', () => {
            expect(storageHandler.fetch("externals")).toEqual(
                {global: {"rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url:"http://localhost:3001/rxjs.js"}}}
            );
            expect(storageHandler.fetch("remotes")).toEqual(
                { "team/mfe1": MOCK_REMOTE_INFO() }
            );
        });
    })

    describe('update', () => {
        it('should update the value', () => {
            const expected = {global: {"tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url:"http://localhost:3001/tslib.js"}}}

            storageHandler.update("externals", _ => (expected));
            
            const actual = storageHandler.fetch("externals");

            expect(actual).toEqual(expected);
        });

        it('should update entries multiple times', () => {
            storageHandler
                .update("remotes", _ => ({"team/mfe2": MOCK_REMOTE_INFO_II()}))
                .update("remotes", _ => ({"team/mfe3": MOCK_REMOTE_INFO_III()}))
            
            const actual = storageHandler.fetch("remotes");

            expect(actual).toEqual({"team/mfe3": MOCK_REMOTE_INFO_III()});
        });

        it('should update multiple entries', () => {
            storageHandler
                .update("externals", _ => ({global: {"tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url:"http://localhost:3001/tslib.js"}}}))
                .update("remotes", _ => ({"team/mfe2": MOCK_REMOTE_INFO_II()}))
            
            const actual1 = storageHandler.fetch("externals");
            expect(actual1).toEqual({global: {"tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url:"http://localhost:3001/tslib.js"}}});

            const actual2 = storageHandler.fetch("remotes");
            expect(actual2).toEqual({"team/mfe2": MOCK_REMOTE_INFO_II()});
        });

        it('should be able to manipulate the current entry value', () => {
            storageHandler
                .update("externals", v => {
                    v["global"]["tslib"] = {version: "2.8.1", requiredVersion: "~2.8.0", url:"http://localhost:3001/tslib.js"};
                    return v;
                })
            
            const actual = storageHandler.fetch("externals");
            expect(actual).toEqual({
                global: {
                "rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url:"http://localhost:3001/rxjs.js"},
                "tslib": {version: "2.8.1", requiredVersion: "~2.8.0", url:"http://localhost:3001/tslib.js"}
                }

            });
        });
    });

    describe('get', () => {
        it('should get the storage object', () => {
            const actual: StorageOf<NfCache> = storageHandler.get();

            expect(actual["externals"].get()).toEqual({global: {"rxjs": {version: "7.8.1", requiredVersion: "~7.8.0", url:"http://localhost:3001/rxjs.js"}}});
            expect(actual["remotes"].get()).toEqual({"team/mfe1": MOCK_REMOTE_INFO()});
        });
    });

});