import type { RemoteName } from '../remote/remote-info.contract';

export type VersionName = string;

export type Version = {
  tag: VersionName;
};

export type ScopedVersion = Version & {
  file: string;
};

export type SharedVersion = Version & {
  host: boolean;
  action: SharedVersionAction;
  remotes: SharedVersionMeta[];
};

export type SharedVersionAction = 'skip' | 'scope' | 'share';

export const FALLBACK_VERSION = '0.0.0';

export type SharedVersionMeta = {
  file: string;
  requiredVersion: string;
  strictVersion: boolean;
  cached: boolean;
  name: RemoteName;
};
