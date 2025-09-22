import type { Manifest } from 'lib/1.domain';
import type { LoadRemoteModule } from 'lib/init-federation.contract';

export type InitResult = {
  loadRemoteModule: LoadRemoteModule;
};

export type InitFlow = (remotesOrManifestUrl: string | Manifest) => Promise<InitResult>;
