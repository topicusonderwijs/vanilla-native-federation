import type { ModeConfig, ModeOptions } from "lib/2.app/config/mode.contract";
import { defaultProfile } from "./default.profile";

export const createModeConfig = (override: Partial<ModeOptions>): ModeConfig => ({
    strict: false,
    profile: defaultProfile,
    ...override
});