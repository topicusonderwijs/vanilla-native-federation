import type { LoadRemoteModule } from 'lib/init-federation.contract';

export type ForExposingModuleLoader = () => Promise<LoadRemoteModule>;
