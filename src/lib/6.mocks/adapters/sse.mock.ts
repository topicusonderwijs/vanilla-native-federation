import { ForSSE } from 'lib/sdk.index';

export const mockSSE = (): jest.Mocked<ForSSE> => ({
  watchRemoteBuilds: jest.fn(),
});
