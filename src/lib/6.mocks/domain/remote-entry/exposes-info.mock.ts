import { ExposesInfo } from 'lib/1.domain/remote-entry/remote-entry.contract';

/**
 * --------------------------------------
 *  EXPOSES MODULES
 * --------------------------------------
 */
export const mockExposedModule = (moduleName: string, file?: string): ExposesInfo => ({
  key: moduleName,
  outFileName: file || `${moduleName}.js`,
});

export const mockExposedModuleA = () => mockExposedModule('./wc-comp-a', 'component-a.js');
export const mockExposedModuleB = () => mockExposedModule('./wc-comp-b', 'component-b.js');
export const mockExposedModuleC = () => mockExposedModule('./wc-comp-c', 'component-c.js');
export const mockExposedModuleD = () => mockExposedModule('./wc-comp-d', 'component-d.js');
