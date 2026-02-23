import type { RemoteName } from '../remote/remote-info.contract';

export type ChunkInfo = Record<string, string[]>;
export type SharedChunks = Record<RemoteName, ChunkInfo>;
