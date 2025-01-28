import { mockStorageEntry } from "../../../mock/storage.mock";
import { NfCache, StorageHandler, StorageOf } from "./storage.contract";
import { storageHandlerFactory } from "./storage.handler";
import { Remote } from "../remote-info/remote-info.contract";
import { SharedInfo } from "@softarc/native-federation-runtime";

describe('storageHandler', () => {

    let storage: NfCache;
    let storageHandler: StorageHandler<NfCache>;

    const REMOTE_MFE1_MOCK: () => Remote = () => 
        JSON.parse(JSON.stringify({
            name: 'team/mfe1', 
            shared: [
                {
                    packageName: "rxjs",
                    outFileName: "rxjs.js",
                    requiredVersion: "~7.8.0",
                    singleton: true,
                    strictVersion: true,
                    version: "7.8.1",
                }
            ] as SharedInfo[], 
            exposes: [{key: './comp', outFileName: 'comp.js'}], 
            baseUrl: 'http://localhost:3001'
        }))

    beforeEach(() => {
        storage = {
            externals: {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"},
            remoteNamesToRemote: { "team/mfe1": REMOTE_MFE1_MOCK() },
            baseUrlToRemoteNames: { "http://localhost:3001": "team/mfe1" }
        };
        storageHandler = storageHandlerFactory(storage, mockStorageEntry);
    });

    describe('entry', () => {
        it('should get the initial values', () => {            
            expect(storageHandler.entry("externals").get()).toEqual(
                {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"}
            );
            expect(storageHandler.entry("remoteNamesToRemote").get()).toEqual(
                { "team/mfe1": REMOTE_MFE1_MOCK() }
            );
            expect(storageHandler.entry("baseUrlToRemoteNames").get()).toEqual(
                { "http://localhost:3001": "team/mfe1" }
            );
        });
    });

    describe('fetch', () => {
        it('should get the value', () => {
            expect(storageHandler.fetch("externals")).toEqual(
                {"rxjs@7.8.1": "http://localhost:3001/rxjs.js"}
            );
            expect(storageHandler.fetch("remoteNamesToRemote")).toEqual(
                { "team/mfe1": REMOTE_MFE1_MOCK() }
            );
            expect(storageHandler.fetch("baseUrlToRemoteNames")).toEqual(
                { "http://localhost:3001": "team/mfe1" }
            );
        });
    })

    describe('update', () => {
        it('should update the value', () => {
            const expected: Record<string,string> = {"tslib@2.8.1": "http://localhost:3001/tslib.js"};
            storageHandler.update("externals", _ => (expected));
            
            const actual = storageHandler.fetch("externals");

            expect(actual).toEqual(expected);
        });

        it('should update entries multiple times', () => {
            storageHandler
                .update("baseUrlToRemoteNames", _ => ({"http://localhost:3002": "team/mfe2"}))
                .update("baseUrlToRemoteNames", _ => ({"http://localhost:3003": "team/mfe3"}));
            
            const actual = storageHandler.fetch("baseUrlToRemoteNames");

            expect(actual).toEqual({"http://localhost:3003": "team/mfe3"});
        });

        it('should update multiple entries', () => {
            storageHandler
                .update("externals", _ => ({"tslib@2.8.1": "http://localhost:3001/tslib.js"}))
                .update("baseUrlToRemoteNames", _ => ({"http://localhost:3002": "team/mfe2"}));
            
            const actual1 = storageHandler.fetch("externals");
            expect(actual1).toEqual({"tslib@2.8.1": "http://localhost:3001/tslib.js"});

            const actual2 = storageHandler.fetch("baseUrlToRemoteNames");
            expect(actual2).toEqual({"http://localhost:3002": "team/mfe2"});
        });

        it('should be able to manipulate the current entry value', () => {
            storageHandler
                .update("externals", v => {
                    v["tslib@2.8.1"] = "http://localhost:3001/tslib.js";
                    return v;
                })
            
            const actual = storageHandler.fetch("externals");
            expect(actual).toEqual({
                "rxjs@7.8.1": "http://localhost:3001/rxjs.js",
                "tslib@2.8.1": "http://localhost:3001/tslib.js"
            });
        });
    });

    describe('get', () => {
        it('should get the storage object', () => {
            const actual: StorageOf<NfCache> = storageHandler.get();

            expect(actual["externals"].get()).toEqual({"rxjs@7.8.1": "http://localhost:3001/rxjs.js"});
            expect(actual["remoteNamesToRemote"].get()).toEqual({"team/mfe1": REMOTE_MFE1_MOCK()});
            expect(actual["baseUrlToRemoteNames"].get()).toEqual({"http://localhost:3001": "team/mfe1"});

        });
    });

});