import type { ConfigContract } from './options.index';
import type { DrivingContract, DynamicInitResult } from './sdk.index';

export type LoadRemoteModule<TModule = unknown> = (
  remoteName: string,
  exposedModule: string
) => Promise<TModule>;

export type NativeFederationResult = DynamicInitResult<{
  config: ConfigContract;
  adapters: DrivingContract;
  loadRemoteModule: LoadRemoteModule;
  remote: <TModule = unknown>(
    remoteName: string
  ) => {
    loadModule: (exposedModule: string) => Promise<TModule>;
  };
  as: <TModule = unknown>() => { loadRemoteModule: LoadRemoteModule<TModule> };
}>;
