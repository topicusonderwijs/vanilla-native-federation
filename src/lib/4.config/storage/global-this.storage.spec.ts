import { NF_STORAGE_ENTRY } from "../../2.app/config/storage.contract";
import { RemoteInfo } from "../../1.domain/remote/remote-info.contract";
import { globalThisStorageEntry } from './global-this.storage';

describe('globalThisStorageEntry', () => {

    const MOCK_REMOTE_INFO = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3001/",
        exposes: [{moduleName: "./comp", url: "http://localhost:3001/comp.js"}]
    });

    const MOCK_REMOTE_INFO_II = (): RemoteInfo => ({
        scopeUrl: "http://localhost:3002/",
        exposes: [{moduleName: "./comp", url: "http://localhost:3002/comp.js"}]
    });

    beforeEach(() => {
        delete (globalThis as any)[NF_STORAGE_ENTRY];
    });

    it('creates namespace if it does not exist', () => {
        globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});

        expect((globalThis as any)[NF_STORAGE_ENTRY]).toEqual({
            "remotes": {"team/mfe1": MOCK_REMOTE_INFO()}
        });
    });

    describe('get', () => {
        it('get should return the fallback value', () => {
            const entry = globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO()};

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});

            const expected = {"team/mfe1": MOCK_REMOTE_INFO()};

            const keyA = entry.get();
            keyA["team/mfe1"] = MOCK_REMOTE_INFO_II();

            expect(entry.get()).toEqual(expected);
        });
    })

    describe('set', () => {
        it('set stores value in globalThis namespace', () => {
            const entry = globalThisStorageEntry<Record<string, RemoteInfo>>('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            const expected = {"team/mfe2": MOCK_REMOTE_INFO_II()};

            entry.set({"team/mfe2": MOCK_REMOTE_INFO_II()});

            expect(entry.get()).toEqual(expected);
        });

        it('not allow any mutations', () => {
            const entry = globalThisStorageEntry('remotes', {"team/mfe1": MOCK_REMOTE_INFO()});
            const newEntry = {"team/mfe2": MOCK_REMOTE_INFO_II()} as any;
            entry.set(newEntry);

            newEntry["MALICOUS_INJECT"] = "BAD_SCRIPT.js";

            expect(entry.get()).toEqual({"team/mfe2": MOCK_REMOTE_INFO_II()});
        });
    });
});