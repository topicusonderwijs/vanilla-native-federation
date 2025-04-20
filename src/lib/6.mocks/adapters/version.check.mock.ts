import { ForVersionChecking } from "lib/2.app/driving-ports/for-version-checking.port";

export const mockVersionCheck = ()
    : jest.Mocked<ForVersionChecking> => ({
        isValidSemver: jest.fn((_) => true),
        isCompatible: jest.fn((_v, _r) => true), 
        compare: jest.fn((_a, _b) => 0)
    });