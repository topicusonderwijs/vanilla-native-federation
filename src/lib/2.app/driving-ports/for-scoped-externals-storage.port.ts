import type { RemoteName, ScopedExternals, ScopedVersion } from 'lib/1.domain';

export type ForScopedExternalsStorage = {
  addExternal: (
    remoteName: RemoteName,
    external: string,
    version: ScopedVersion
  ) => ForScopedExternalsStorage;
  remove: (remoteName: RemoteName) => ForScopedExternalsStorage;
  getAll: () => ScopedExternals;
  commit: () => ForScopedExternalsStorage;
};
