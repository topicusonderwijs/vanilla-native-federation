import type { ConfigContract } from './2.app/config/config.contract';
import type { DrivingContract } from './2.app/driving-ports/driving.contract';
import type { DynamicInitResult } from './2.app/driver-ports/dynamic-init/flow.contract';

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
