/**
 * @deprecated This package is deprecated. Please migrate to @softarc/native-federation-orchestrator
 * See: https://github.com/native-federation/orchestrator
 * @packageDocumentation
 */

/** @deprecated Use @softarc/native-federation-orchestrator instead */
export { initFederation } from './init-federation';
/** @deprecated Use @softarc/native-federation-orchestrator instead */
export { NFError } from './native-federation.error';

/** @deprecated Use @softarc/native-federation-orchestrator instead */
export { LoadRemoteModule, NativeFederationResult } from './init-federation.contract';

/** @deprecated Use @softarc/native-federation-orchestrator instead */
export { createConfigHandlers } from './5.di/config.factory';
/** @deprecated Use @softarc/native-federation-orchestrator instead */
export { createDriving } from './5.di/driving.factory';
/** @deprecated Use @softarc/native-federation-orchestrator instead */
export {
  createDynamicInitDrivers,
  DYNAMIC_INIT_FLOW_FACTORY,
  createDynamicInitFlow,
} from './5.di/flows/dynamic-init.factory';
/** @deprecated Use @softarc/native-federation-orchestrator instead */
export { createInitDrivers, INIT_FLOW_FACTORY, createInitFlow } from './5.di/flows/init.factory';
