import type { ConfigContract } from './2.app/config';
import type { DrivingContract } from './2.app/driving-ports/driving.contract';

export type LoadRemoteModule<TModule = unknown> = (
  remoteName: string,
  exposedModule: string
) => Promise<TModule>;

export type InitFederationResult = {
  config: ConfigContract;
  adapters: DrivingContract;
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
