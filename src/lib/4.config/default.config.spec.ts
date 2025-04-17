import { createHostConfig } from "./host/host.config";
import * as defaultImportMap from "./import-map/use-default";
import * as logHandler from "./logging/log.handler";
import * as storageHandler from "./storage/global-this.storage";
import { createLogConfig } from "./logging/log.config";
import { createModeConfig } from "./mode/mode.config";
import { createStorageConfig } from "./storage/storage.config";

import { createImportMapConfig } from "./import-map/import-map.config";
import { noopLogger } from "./logging/noop.logger";

describe('DefaultConfig', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    })

    describe('HostOptions -> HostConfig', () => {
        it('Should apply correct fallback config from options', () => {
            const actual = createHostConfig({});
            expect(actual).toEqual({
                hostRemoteEntry: false
            })
        });  
    })

    describe('ImportMapOptions -> ImportMapConfig', () => {
        it('Should apply correct fallback config from options', () => {
            const spy = jest.spyOn(defaultImportMap, 'useDefaultImportMap');
            const actual = createImportMapConfig({});

            expect(spy).toHaveBeenCalled();
            expect(actual.importMapType).toBe("importmap");
        });
    });

    describe('LoggingOptions -> ImportMapConfig', () => {
        it('Should apply correct fallback config from options', () => {
            const spy = jest.spyOn(logHandler, 'createLogHandler');

            createLogConfig({});

            expect(spy).toHaveBeenCalledWith(noopLogger, "error");
        });  
    });

    describe('ModeOptions -> ModeConfig', () => {
        it('Should apply correct fallback config from options', () => {
            const actual = createModeConfig({});

            expect(actual).toEqual({
                strict: false,
                latestSharedExternal: false
            });
        });  
    });

    describe('StorageOptions -> StorageConfig', () => {
        it('Should apply correct fallback config from options', () => {
            const spy = jest.spyOn(storageHandler, 'globalThisStorageEntry');

            const actual = createStorageConfig({});
            actual.storage("entry", {});

            expect(spy).toHaveBeenCalled();
            expect(actual.clearCache).toBe(false);
        });  
    });
})
