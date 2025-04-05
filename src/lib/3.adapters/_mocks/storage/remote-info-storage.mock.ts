import { ForStoringRemoteInfo } from "../../../2.app/driving-ports/for-storing-remote-info.port";

export const createMockRemoteInfoStorage = ()
    : jest.Mocked<ForStoringRemoteInfo> => ({
        contains: jest.fn(),
        addOrUpdate: jest.fn(),
        tryGet: jest.fn()
    })