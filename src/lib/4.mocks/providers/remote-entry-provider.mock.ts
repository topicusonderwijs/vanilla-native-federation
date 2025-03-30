import { ForProvidingRemoteEntry } from "../../2.app/driving-ports/for-providing-remote-entry.port";

export const MockRemoteEntryProvider = ()
    : jest.Mocked<ForProvidingRemoteEntry> => ({
        provide: jest.fn()
    })