import { ForProvidingManifest } from "../../../2.app/driving-ports/for-providing-manifest.port";

export const createMockManifestProvider = ()
    : jest.Mocked<ForProvidingManifest> => ({
        provide: jest.fn()
    })