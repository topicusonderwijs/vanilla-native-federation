export type ForSSE = {
  watchRemoteBuilds: (endpoint: string) => void;
  closeAll: () => void;
};
