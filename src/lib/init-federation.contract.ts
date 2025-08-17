import type { ConfigContract } from 'lib/2.app/config';

export type LoadRemoteModule<TModule = unknown> = (
  remoteName: string,
  exposedModule: string
) => Promise<TModule>;

export type InitFederationResult = {
  config: ConfigContract;
  loadRemoteModule: LoadRemoteModule;
  remote: <TModule = unknown>(
    remoteName: string
  ) => {
    loadModule: (exposedModule: string) => Promise<TModule>;
  };
  as: <TModule = unknown>() => { loadRemoteModule: LoadRemoteModule<TModule> };
};

export type InitRemoteEntry = (
  remoteEntryUrl: string,
  remoteName?: string
) => Promise<LazyInitFederationResult>;

export type LazyInitFederationResult = InitFederationResult & {
  initRemoteEntry: (
    remoteEntryUrl: string,
    remoteName?: string
  ) => Promise<LazyInitFederationResult>;
};
