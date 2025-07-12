import type { ModeConfig, ModeOptions } from 'lib/2.app/config/mode.contract';
import { defaultProfile } from './default.profile';

export const createModeConfig = (override: ModeOptions): ModeConfig => ({
  strict: override.strict ?? false,
  profile: override.profile ?? defaultProfile,
});
