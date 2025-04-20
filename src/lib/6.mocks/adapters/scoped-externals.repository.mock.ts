import { ForScopedExternalsStorage } from "lib/2.app/driving-ports/for-scoped-externals-storage.port";

export const mockScopedExternalsRepository = ()
    : jest.Mocked<ForScopedExternalsStorage> => ({
        tryGetScope: jest.fn(),
        contains: jest.fn(),
        clearScope: jest.fn(),
        addExternal: jest.fn(),
        getAll: jest.fn(),
        commit: jest.fn(),
    });