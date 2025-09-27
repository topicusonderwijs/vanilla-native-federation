import { ForVersionChecking } from '../../2.app/driving-ports/for-version-checking.port';

export const mockVersionCheck = (): ForVersionChecking => ({
  isCompatible: jest.fn(),
  isValidSemver: jest.fn(),
  compare: jest.fn(),
  smallestVersion: jest.fn(),
});
