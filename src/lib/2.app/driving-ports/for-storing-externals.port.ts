import type { Externals } from "lib/1.domain";
import type { Optional } from "lib/utils/optional";

export type ForStoringExternals = {
    tryGetScope: (scope: string) => Optional<Externals>
}