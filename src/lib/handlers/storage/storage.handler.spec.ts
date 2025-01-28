import { mockStorage } from "../../../mock/storage.mock";
import { StorageHandler, StorageOf } from "./storage.contract";
import { storageHandlerFactory } from "./storage.handler";
import { createCache, toStorage } from "./to-storage";

describe('storageHandler', () => {

    let storage: NfStorage;
    let storageHandler: StorageHandler<NfStorage>;

    beforeEach(() => {
        storage = toStorage(createCache(), mockStorage);
        storageHandler = storageHandlerFactory(storage);
    });

    describe('entry', () => {
        it('should get the initial values', () => {
            const value = storageHandler.fetch("externals");
            
            // expect(storageHandler.entry("key1").get()).toEqual("fallback");
            // expect(storageHandler.entry("key2").get()).toEqual({});
            // expect(storageHandler.entry("key3").get()).toEqual([2,3]);
        });

        it('should allow mutations', () => {
            storageHandler.entry("key1").set("value");
            storageHandler.entry("key3").set([1,2]);

            expect(storageHandler.entry("key1").get()).toEqual("value");
            expect(storageHandler.entry("key3").get()).toEqual([1,2]);
        });
    });

    describe('fetch', () => {
        it('should get the value', () => {
            expect(storageHandler.fetch("key1")).toEqual("fallback");
            expect(storageHandler.fetch("key2")).toEqual({});
            expect(storageHandler.fetch("key3")).toEqual([2,3]);
        });

        it('should not allow mutations', () => {
            let tmp = storageHandler.fetch("key3");
            tmp.push(4);

            expect(storageHandler.entry("key3").get()).toEqual([2,3]);
        });
    })
});