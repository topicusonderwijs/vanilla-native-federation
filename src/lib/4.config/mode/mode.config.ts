import type { ModeConfig } from "lib/2.app/config/mode.contract";

export const createModeConfig = (override: Partial<ModeConfig>): ModeConfig => ({
    strictVersionResolving: false,
    ...override
});