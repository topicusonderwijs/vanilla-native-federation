import { StorageEntryHandler } from 'lib/2.app/config/storage.contract';
import { sessionStorageEntry } from './session.storage';
import { RemoteInfo } from 'lib/1.domain/remote/remote-info.contract';
import {
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';

describe('sessionStorageEntry', () => {
  let mockStorage: any;
  let storageEntryHandler: StorageEntryHandler;
  beforeEach(() => {
    mockStorage = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
      },
    });
    storageEntryHandler = sessionStorageEntry('namespace');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Create entry with default value on init', () => {
    storageEntryHandler('remotes', { 'team/mfe1': mockRemoteInfo_MFE1() });

    expect(mockStorage[`${'namespace'}.remotes`]).toBeDefined();
    expect(JSON.parse(mockStorage[`${'namespace'}.remotes`])).toEqual({
      'team/mfe1': mockRemoteInfo_MFE1(),
    });
  });

  describe('get', () => {
    it('get should return the fallback value', () => {
      const entry = storageEntryHandler('remotes', { 'team/mfe1': mockRemoteInfo_MFE1() });

      const expected = { 'team/mfe1': mockRemoteInfo_MFE1() };

      expect(entry.get()).toEqual(expected);
    });

    it('not allow any mutations', () => {
      const entry = storageEntryHandler('remotes', { 'team/mfe1': mockRemoteInfo_MFE1() });

      const expected = { 'team/mfe1': mockRemoteInfo_MFE1() };

      const keyA = entry.get()!;
      keyA['team/mfe1'] = mockRemoteInfo_MFE2();

      expect(entry.get()).toEqual(expected);
    });
  });

  describe('set', () => {
    it('set stores value in namespace', () => {
      const entry = storageEntryHandler<Record<string, RemoteInfo>>('remotes', {
        'team/mfe1': mockRemoteInfo_MFE1(),
      });
      const expected = { 'team/mfe2': mockRemoteInfo_MFE2() };

      entry.set({ 'team/mfe2': mockRemoteInfo_MFE2() });

      expect(entry.get()).toEqual(expected);
    });

    it('not allow any mutations', () => {
      const entry = storageEntryHandler('remotes', { 'team/mfe1': mockRemoteInfo_MFE1() });
      const newEntry = { 'team/mfe2': mockRemoteInfo_MFE2() } as any;
      entry.set(newEntry);

      newEntry['MALICOUS_INJECT'] = 'BAD_SCRIPT.js';

      expect(entry.get()).toEqual({ 'team/mfe2': mockRemoteInfo_MFE2() });
    });
  });

  describe('clear', () => {
    it('clears the entry back to the initialValue', () => {
      mockStorage[`${'namespace'}.remotes`] = JSON.stringify({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      const entry = storageEntryHandler<Record<string, RemoteInfo>>('remotes', {});

      expect(entry.get()).toEqual({ 'team/mfe1': mockRemoteInfo_MFE1() });

      entry.clear();

      expect(entry.get()).toEqual({});
    });
  });
});
