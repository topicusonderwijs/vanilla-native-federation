import type { RemoteName } from '../remote/remote-info.contract';

export type VersionName = string;

export type Version = {
  version: VersionName;
  file: string;
};

export type SharedVersionAction = 'skip' | 'scope' | 'share' | 'override';

export const FALLBACK_VERSION = '0.0.0';

export type SharedVersion = Version & {
  requiredVersion: string;
  strictVersion: boolean;
  cached: boolean;
  host: boolean;
  remote: RemoteName;
  usedBy?: string[];
  action: SharedVersionAction;
};
