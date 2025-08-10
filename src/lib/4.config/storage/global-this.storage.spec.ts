import { RemoteInfo } from 'lib/1.domain/remote/remote-info.contract';
import { globalThisStorageEntry } from './global-this.storage';
import { StorageEntry, StorageEntryHandler } from 'lib/2.app/config/storage.contract';
import { mockRemoteInfo_MFE1 } from 'lib/6.mocks/domain/remote-info/remote-info.mock';

describe('globalThisStorageEntry', () => {
  let storageEntryHandler: StorageEntryHandler;

  beforeEach(() => {
    delete (globalThis as any)['namespace'];
    storageEntryHandler = globalThisStorageEntry('namespace');
  });

  it('creates namespace if it does not exist', () => {
    storageEntryHandler('remotes', { 'team/mfe1': mockRemoteInfo_MFE1() });

    expect((globalThis as any)['namespace']).toEqual({
      remotes: { 'team/mfe1': mockRemoteInfo_MFE1() },
    });
  });

  describe('get', () => {
    let entry: StorageEntry<{ 'team/mfe1': RemoteInfo }>;

    beforeEach(() => {
      entry = storageEntryHandler('remotes', { 'team/mfe1': mockRemoteInfo_MFE1() });
    });

    it('get should return the fallback value', () => {
      const expected = { 'team/mfe1': mockRemoteInfo_MFE1() };
      expect(entry.get()).toEqual(expected);
    });

    it('not allow any mutations', () => {
      const expected = { 'team/mfe1': mockRemoteInfo_MFE1() };

      const keyA = entry.get()!;
      keyA['team/mfe1'] = mockRemoteInfo_MFE1();

      expect(entry.get()).toEqual(expected);
    });
  });

  describe('set', () => {
    it('set stores value in globalThis namespace', () => {
      const entry = storageEntryHandler<Record<string, RemoteInfo>>('remotes', {
        'team/mfe1': mockRemoteInfo_MFE1(),
      });
      const expected = { 'team/mfe2': mockRemoteInfo_MFE1() };

      entry.set({ 'team/mfe2': mockRemoteInfo_MFE1() });

      expect(entry.get()).toEqual(expected);
    });

    it('not allow any mutations', () => {
      const entry = storageEntryHandler('remotes', { 'team/mfe1': mockRemoteInfo_MFE1() });
      const newEntry = { 'team/mfe2': mockRemoteInfo_MFE1() } as any;
      entry.set(newEntry);

      newEntry['MALICOUS_INJECT'] = 'BAD_SCRIPT.js';

      expect(entry.get()).toEqual({ 'team/mfe2': mockRemoteInfo_MFE1() });
    });
  });

  describe('clear', () => {
    it('clears the entry back to the initialValue', () => {
      (globalThis as any)['namespace'] = {};
      (globalThis as any)['namespace']['remotes'] = { 'team/mfe1': mockRemoteInfo_MFE1() };

      const entry = storageEntryHandler<Record<string, RemoteInfo>>('remotes', {});

      expect(entry.get()).toEqual({ 'team/mfe1': mockRemoteInfo_MFE1() });

      entry.clear();

      expect(entry.get()).toEqual({});
    });
  });
});
