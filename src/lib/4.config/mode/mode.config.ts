import type { ModeConfig, ModeOptions } from "lib/2.app/config/mode.contract";

export const createModeConfig = (override: Partial<ModeOptions>): ModeConfig => ({
    strict: false,
    latestSharedExternal: false,
    ...override
});