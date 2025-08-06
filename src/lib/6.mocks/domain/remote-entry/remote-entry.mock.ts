import { RemoteEntry, FederationInfo } from 'lib/1.domain';
import {
  mockScopeUrl_host,
  mockScopeUrl_MFE1,
  mockScopeUrl_MFE2,
  mockScopeUrl_MFE3,
} from '../scope-url.mock';
import {
  mockFederationInfo_HOST,
  mockFederationInfo_MFE1,
  mockFederationInfo_MFE2,
  mockFederationInfo_MFE3,
} from './federation-info.mock';

type MockRemoteEntryOptions = Partial<FederationInfo> & {
  host?: boolean;
  override?: boolean;
};
/**
 * --------------------------------------
 *  REMOTE_ENTRY
 * --------------------------------------
 */
export const mockRemoteEntry = (
  scopeUrl: string,
  federationInfo: FederationInfo = mockFederationInfo_MFE1(),
  opts: MockRemoteEntryOptions = {}
): RemoteEntry => ({
  ...federationInfo,
  ...opts,
  url: `${scopeUrl}remoteEntry.json`,
});

export const mockRemoteEntry_MFE1 = (opts: MockRemoteEntryOptions = {}): RemoteEntry =>
  mockRemoteEntry(mockScopeUrl_MFE1(), mockFederationInfo_MFE1(), opts);

export const mockRemoteEntry_MFE2 = (opts: MockRemoteEntryOptions = {}): RemoteEntry =>
  mockRemoteEntry(mockScopeUrl_MFE2(), mockFederationInfo_MFE2(), opts);

export const mockRemoteEntry_MFE3 = (opts: MockRemoteEntryOptions = {}): RemoteEntry =>
  mockRemoteEntry(mockScopeUrl_MFE3(), mockFederationInfo_MFE3(), opts);

export const mockRemoteEntry_HOST = (opts: MockRemoteEntryOptions = {}): RemoteEntry =>
  mockRemoteEntry(mockScopeUrl_host(), { host: true, ...mockFederationInfo_HOST(), ...opts });
