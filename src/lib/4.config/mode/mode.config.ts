import type { ModeConfig, ModeOptions } from 'lib/2.app/config/mode.contract';
import { defaultProfile } from './default.profile';

export const createModeConfig = (override: ModeOptions): ModeConfig => {
  const strictnessConfig =
    typeof override.strict === 'boolean'
      ? {
          strictRemoteEntry: override.strict,
          strictExternalCompatibility: override.strict,
          strictExternalVersion: override.strict,
          strictImportMap: override.strict,
        }
      : {
          strictRemoteEntry: override.strict?.strictRemoteEntry ?? false,
          strictExternalCompatibility: override.strict?.strictExternalCompatibility ?? false,
          strictExternalVersion: override.strict?.strictExternalVersion ?? false,
          strictImportMap: override.strict?.strictImportMap ?? false,
        };

  return {
    strict: strictnessConfig,
    profile: { ...defaultProfile, ...(override.profile ?? {}) },
  };
};
