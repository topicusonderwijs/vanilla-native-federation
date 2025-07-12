import { ForProvidingManifest } from 'lib/2.app/driving-ports/for-providing-manifest.port';
import { MOCK_MANIFEST } from '../domain/manifest.mock';
import { Manifest } from 'lib/1.domain';

export const mockManifestProvider = (): jest.Mocked<ForProvidingManifest> => ({
  provide: jest.fn((manifest: string | Manifest) => {
    return Promise.resolve(typeof manifest === 'string' ? MOCK_MANIFEST() : manifest);
  }),
});
