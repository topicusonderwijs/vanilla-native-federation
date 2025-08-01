import { ForProvidingRemoteEntries } from 'lib/2.app/driving-ports/for-providing-remote-entries.port';

export const mockRemoteEntryProvider = (): jest.Mocked<ForProvidingRemoteEntries> => ({
  provide: jest.fn(),
});
