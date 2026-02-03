export type ForSharedChunksStorage = {
  addOrReplace: (remote: string, buildName: string, chunks: string[]) => ForSharedChunksStorage;
  commit: () => ForSharedChunksStorage;
};
