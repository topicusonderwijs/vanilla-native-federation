export { initFederation } from './init-federation';
export { NFError } from './native-federation.error';

export { LoadRemoteModule, NativeFederationResult } from './init-federation.contract';

export { createConfigHandlers } from './5.di/config.factory';
export { createDriving } from './5.di/driving.factory';
export {
  createDynamicInitDrivers,
  DYNAMIC_INIT_FLOW_FACTORY,
  createDynamicInitFlow,
} from './5.di/flows/dynamic-init.factory';
export { createInitDrivers, INIT_FLOW_FACTORY, createInitFlow } from './5.di/flows/init.factory';
