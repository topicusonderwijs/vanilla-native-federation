import { ForScopedExternalsStorage } from "lib/2.app/driving-ports/for-scoped-externals-storage.port";

export const mockScopedExternalsRepository = ()
    : jest.Mocked<ForScopedExternalsStorage> => ({
        addExternal: jest.fn(),
        getAll: jest.fn(),
        commit: jest.fn(),
    });