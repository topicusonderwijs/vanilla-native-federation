import { ForRemoteInfoStorage } from "../../2.app/driving-ports/for-remote-info-storage.port";

export const mockRemoteInfoRepository = ()
    : jest.Mocked<ForRemoteInfoStorage> => ({
        contains: jest.fn(),
        addOrUpdate: jest.fn(),
        tryGet: jest.fn(),
        tryGetModule: jest.fn(),
        getAll: jest.fn(),
        commit: jest.fn()
    });