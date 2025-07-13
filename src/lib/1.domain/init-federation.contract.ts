import type { ConfigContract } from 'lib/2.app/config';

export type LoadRemoteModule<TModule = unknown> = (
  remoteName: string,
  exposedModule: string
) => Promise<TModule>;

export type InitFederationResult = Promise<{
  config: ConfigContract;
  loadRemoteModule: LoadRemoteModule;
  remote: <TModule = unknown>(
    remoteName: string
  ) => {
    loadModule: (exposedModule: string) => Promise<TModule>;
  };
  as: <TModule = unknown>() => { loadRemoteModule: LoadRemoteModule<TModule> };
}>;
