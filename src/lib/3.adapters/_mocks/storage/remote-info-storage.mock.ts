import { ForStoringRemoteInfo } from "../../../2.app/driving-ports/for-storing-remote-info";

export const createMockRemoteInfoStorage = ()
    : jest.Mocked<ForStoringRemoteInfo> => ({
        contains: jest.fn(),
        get: jest.fn()
    })