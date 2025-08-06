import { RemoteModule } from 'lib/1.domain';

/**
 * --------------------------------------
 *  REMOTE MODULE
 * --------------------------------------
 */
export const mockRemoteModule = (moduleName: string, file?: string): RemoteModule => ({
  moduleName,
  file: file || `${moduleName}.js`,
});

export const mockRemoteModuleA = () => mockRemoteModule('./wc-comp-a', 'component-a.js');
export const mockRemoteModuleB = () => mockRemoteModule('./wc-comp-b', 'component-b.js');
export const mockRemoteModuleC = () => mockRemoteModule('./wc-comp-c', 'component-c.js');
export const mockRemoteModuleD = () => mockRemoteModule('./wc-comp-d', 'component-d.js');
