import type { ChunkInfo } from '@softarc/native-federation/domain';
import type { RemoteName } from '../remote/remote-info.contract';

export type SharedChunks = Record<RemoteName, ChunkInfo>;
