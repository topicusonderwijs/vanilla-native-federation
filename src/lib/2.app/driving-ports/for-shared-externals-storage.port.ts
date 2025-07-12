import type { SharedExternal, SharedScope, SharedVersion } from 'lib/1.domain';
import type { Optional } from 'lib/utils/optional';

export type ForSharedExternalsStorage = {
  tryGetVersions: (external: string, sharedScope?: string) => Optional<SharedVersion[]>;
  getAll: (sharedScope?: string) => SharedScope;
  getScopes: (o?: { includeGlobal: boolean }) => string[];
  addOrUpdate: (
    name: string,
    external: SharedExternal,
    sharedScope?: string
  ) => ForSharedExternalsStorage;
  commit: () => ForSharedExternalsStorage;
};
