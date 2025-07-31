import type { RemoteName, SharedExternal, shareScope } from 'lib/1.domain';
import type { Optional } from 'lib/utils/optional';

export type ForSharedExternalsStorage = {
  tryGet: (external: string, shareScope?: string) => Optional<SharedExternal>;
  getAll: (shareScope?: string) => shareScope;
  getScopes: (o?: { includeGlobal: boolean }) => string[];
  scopeType: (shareScope?: string) => 'global' | 'strict' | 'shareScope';
  removeFromAllScopes: (remoteName: RemoteName) => void;
  addOrUpdate: (
    name: string,
    external: SharedExternal,
    shareScope?: string
  ) => ForSharedExternalsStorage;
  commit: () => ForSharedExternalsStorage;
};
