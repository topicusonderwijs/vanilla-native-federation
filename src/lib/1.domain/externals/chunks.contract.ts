import { ChunkInfo } from '@softarc/native-federation/domain';
import { RemoteName } from '../remote/remote-info.contract';

export type SharedChunks = Record<RemoteName, ChunkInfo>;
