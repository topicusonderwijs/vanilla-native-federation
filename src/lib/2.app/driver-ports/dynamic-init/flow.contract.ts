export type DynamicInitResult<TFederationResult = {}> = TFederationResult & {
  initRemoteEntry: (
    remoteEntryUrl: string,
    remoteName?: string
  ) => Promise<DynamicInitResult<TFederationResult>>;
};

export type DynamicInitFlow = (
  remoteEntryUrl: string,
  remoteName?: string
) => Promise<DynamicInitResult>;
