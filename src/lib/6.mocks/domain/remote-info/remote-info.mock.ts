import { RemoteInfo, RemoteModule } from 'lib/1.domain';
import {
  mockScopeUrl_host,
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

export const mockRemoteInfo_MFE1 = (remoteModules = [mockRemoteModuleA()]) =>
  mockRemoteInfo(mockScopeUrl_MFE1(), remoteModules);

export const mockRemoteInfo_MFE2 = (remoteModules = [mockRemoteModuleB(), mockRemoteModuleC()]) =>
  mockRemoteInfo(mockScopeUrl_MFE2(), remoteModules);

export const mockRemoteInfo_MFE3 = (remoteModules = [mockRemoteModuleD()]) =>
  mockRemoteInfo(mockScopeUrl_MFE3(), remoteModules);

export const mockRemoteInfo_HOST = (remoteModules = []) =>
  mockRemoteInfo(mockScopeUrl_host(), remoteModules);
