import type { ImportMapHandler } from "lib/2.app/config/import-map.contract";

export const createMockImportMapHandler = ()
    : jest.Mocked<ImportMapHandler> => ({
        getType: jest.fn().mockReturnValue("importmap"),
        importModule: jest.fn()
    })
