import { Optional } from 'lib/sdk.index';

export type ForSharedChunksStorage = {
  addOrReplace: (remote: string, bundleName: string, chunks: string[]) => ForSharedChunksStorage;
  commit: () => ForSharedChunksStorage;
  tryGet: (remote: string, bundleName: string) => Optional<string[]>;
};
