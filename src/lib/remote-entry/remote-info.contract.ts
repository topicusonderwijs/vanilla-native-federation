type ExposesInfo = {
    key: string;
    outFileName: string;
    dev?: {
      entryPoint: string;
    };
}

type SharedInfo = {
  singleton: boolean;
  strictVersion: boolean;
  requiredVersion: string;
  version?: string;
  packageName: string;
  outFileName: string;
  dev?: {
    entryPoint: string;
  };
}

// FederationInfo
type RemoteEntry = {
    name: string;
    shared: SharedInfo[];
    exposes: ExposesInfo[];
}

type RemoteInfo = RemoteEntry & {baseUrl: string}

export {ExposesInfo, SharedInfo, RemoteEntry, RemoteInfo}
