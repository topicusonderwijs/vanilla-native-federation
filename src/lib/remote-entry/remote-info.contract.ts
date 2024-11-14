type TExposesInfo = {
    key: string;
    outFileName: string;
    dev?: {
      entryPoint: string;
    };
}

type TSharedInfo = {
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
type TRemoteEntry = {
    name: string;
    shared: TSharedInfo[];
    exposes: TExposesInfo[];
}

type TRemoteInfo = TRemoteEntry & {baseUrl: string}

export {TExposesInfo, TSharedInfo, TRemoteEntry, TRemoteInfo}
