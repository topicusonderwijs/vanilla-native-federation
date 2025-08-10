import { RemoteInfo, RemoteModule } from 'lib/1.domain';
import {
  mockScopeUrl_HOST,
  mockScopeUrl_MFE1,
  mockScopeUrl_MFE2,
  mockScopeUrl_MFE3,
} from '../scope-url.mock';
import {
  mockRemoteModuleA,
  mockRemoteModuleB,
  mockRemoteModuleC,
  mockRemoteModuleD,
} from './remote-module.mock';

export const mockRemoteInfo = (scopeUrl: string, exposes: RemoteModule[] = []): RemoteInfo => ({
  scopeUrl,
  exposes: exposes ?? [],
});

export const mockRemoteInfo_MFE1 = (
  opts: { exposes: RemoteModule[] } = { exposes: [mockRemoteModuleA()] }
) => mockRemoteInfo(mockScopeUrl_MFE1(), opts.exposes);

export const mockRemoteInfo_MFE2 = (
  opts: { exposes: RemoteModule[] } = { exposes: [mockRemoteModuleB(), mockRemoteModuleC()] }
) => mockRemoteInfo(mockScopeUrl_MFE2(), opts.exposes);

export const mockRemoteInfo_MFE3 = (
  opts: { exposes: RemoteModule[] } = { exposes: [mockRemoteModuleD()] }
) => mockRemoteInfo(mockScopeUrl_MFE3(), opts.exposes);

export const mockRemoteInfo_HOST = (opts: { exposes: RemoteModule[] } = { exposes: [] }) =>
  mockRemoteInfo(mockScopeUrl_HOST(), opts.exposes);
