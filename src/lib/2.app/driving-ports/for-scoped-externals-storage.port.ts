import type { RemoteName, ScopedExternal, ScopedExternals, ScopedVersion } from 'lib/1.domain';
import type { Optional } from 'lib/utils/optional';

export type ForScopedExternalsStorage = {
  addExternal: (
    remoteName: RemoteName,
    external: string,
    version: ScopedVersion
  ) => ForScopedExternalsStorage;
  remove: (remoteName: RemoteName) => ForScopedExternalsStorage;
  tryGet: (remoteName: string) => Optional<ScopedExternal>;
  getAll: () => ScopedExternals;
  commit: () => ForScopedExternalsStorage;
};
