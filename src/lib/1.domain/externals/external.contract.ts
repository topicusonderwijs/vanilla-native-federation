import type { SharedVersion, ScopedVersion } from './version.contract';

export type ExternalName = string;

export type ScopedExternals = Record<string, ExternalsScope>;

export const GLOBAL_SCOPE = '__GLOBAL__';

export const STRICT_SCOPE = 'strict';

export type SharedExternal = {
  dirty: boolean;
  versions: SharedVersion[];
};

export type shareScope = Record<string, SharedExternal>;

export type SharedExternals = Record<string, shareScope> & { [GLOBAL_SCOPE]: shareScope };

export type ExternalsScope = Record<string, ScopedVersion>;
