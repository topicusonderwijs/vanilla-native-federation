import type { Version, SharedVersion } from './version.contract';

export type ExternalName = string;

export type ScopedExternals = Record<string, ExternalsScope>;

export const GLOBAL_SCOPE = '__GLOBAL__';

export type SharedExternal = {
  dirty: boolean;
  versions: SharedVersion[];
};

export type shareScope = Record<string, SharedExternal>;

export type SharedExternals = Record<string, shareScope> & { [GLOBAL_SCOPE]: shareScope };

export type ExternalsScope = Record<string, Version>;
