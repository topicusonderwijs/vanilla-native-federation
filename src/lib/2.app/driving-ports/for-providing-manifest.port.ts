import type { Manifest } from 'lib/1.domain/remote-entry/manifest.contract';

export type ForProvidingManifest = {
  provide: (remotesOrManifestUrl: Manifest | string) => Promise<Manifest>;
};
