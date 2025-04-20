import { ForSharedExternalsStorage } from "lib/2.app/driving-ports/for-shared-externals-storage.port";

export const mockSharedExternalsRepository = ()
    : jest.Mocked<ForSharedExternalsStorage> => ({
        contains: jest.fn(),
        addOrUpdate: jest.fn(),
        getAll: jest.fn(),
        commit: jest.fn(),
        tryGetVersions: jest.fn(),
        set: jest.fn(),    
    });