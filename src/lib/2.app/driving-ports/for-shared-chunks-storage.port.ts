export type ForSharedChunksStorage = {
  addOrReplace: (remote: string, bundleName: string, chunks: string[]) => ForSharedChunksStorage;
  commit: () => ForSharedChunksStorage;
};
