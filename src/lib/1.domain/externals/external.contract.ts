import type { Version, SharedVersion } from "./version.contract";

export type ExternalName = string;

export type ScopedExternals = Record<string, ExternalsScope>

export const GLOBAL_SCOPE = "__GLOBAL__";

export type SharedExternal = {
    dirty: boolean,
    versions: SharedVersion[]
}

export type SharedScope = Record<string, SharedExternal>

export type SharedExternals = Record<string, SharedScope> & {[GLOBAL_SCOPE]: SharedScope}

export type ExternalsScope = Record<string, Version>
