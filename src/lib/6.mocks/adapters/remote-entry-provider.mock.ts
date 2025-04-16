import { ForProvidingRemoteEntries } from "lib/2.app/driving-ports/for-providing-remote-entries.port";

export const createMockRemoteEntryProvider = ()
    : jest.Mocked<ForProvidingRemoteEntries> => ({
        provideHost: jest.fn(),
        provideRemote: jest.fn()
    })