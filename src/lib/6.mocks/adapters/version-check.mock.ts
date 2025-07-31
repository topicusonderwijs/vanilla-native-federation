import { ForVersionChecking } from 'lib/sdk.index';

export const mockVersionCheck = (): ForVersionChecking => ({
  isCompatible: jest.fn(),
  isValidSemver: jest.fn(),
  compare: jest.fn(),
});
