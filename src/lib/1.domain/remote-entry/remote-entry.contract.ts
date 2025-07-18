import type { SharedVersionAction } from '../externals/version.contract';
import type { RemoteEntryUrl } from './manifest.contract';
import type { ExposesInfo } from '@softarc/native-federation-runtime';

type SharedInfo = {
  singleton: boolean;
  strictVersion: boolean;
  requiredVersion: string;
  version?: string;
  packageName: string;
  outFileName: string;
  sharedScope?: string;
  scopeOverride?: string;
  dev?: {
    entryPoint: string;
  };
};

interface FederationInfo {
  name: string;
  exposes: ExposesInfo[];
  shared: SharedInfo[];
}

type RemoteEntry = FederationInfo & {
  url: RemoteEntryUrl;
  host?: boolean;
};

type SharedInfoActions = Record<string, { action: SharedVersionAction; override?: string }>;

export { RemoteEntry, FederationInfo, ExposesInfo, SharedInfo, SharedInfoActions };
