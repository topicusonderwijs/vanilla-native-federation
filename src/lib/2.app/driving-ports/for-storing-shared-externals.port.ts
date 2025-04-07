import type { SharedExternals } from "lib/1.domain";

export type ForStoringSharedExternals = {
    getAll: () => SharedExternals,
    contains: (external: string) => boolean
}