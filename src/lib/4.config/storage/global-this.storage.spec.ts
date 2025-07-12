import { RemoteInfo } from 'lib/1.domain/remote/remote-info.contract';
import { globalThisStorageEntry } from './global-this.storage';
import {
  MOCK_REMOTE_INFO_I,
  MOCK_REMOTE_INFO_II,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { StorageEntryHandler } from 'lib/2.app/config/storage.contract';

describe('globalThisStorageEntry', () => {
  let storageEntryHandler: StorageEntryHandler;

  beforeEach(() => {
    delete (globalThis as any)['namespace'];
    storageEntryHandler = globalThisStorageEntry('namespace');
  });

  it('creates namespace if it does not exist', () => {
    storageEntryHandler('remotes', { 'team/mfe1': MOCK_REMOTE_INFO_I() });

    expect((globalThis as any)['namespace']).toEqual({
      remotes: { 'team/mfe1': MOCK_REMOTE_INFO_I() },
    });
  });

  describe('get', () => {
    it('get should return the fallback value', () => {
      const entry = storageEntryHandler('remotes', { 'team/mfe1': MOCK_REMOTE_INFO_I() });

      const expected = { 'team/mfe1': MOCK_REMOTE_INFO_I() };

      expect(entry.get()).toEqual(expected);
    });

    it('not allow any mutations', () => {
      const entry = storageEntryHandler('remotes', { 'team/mfe1': MOCK_REMOTE_INFO_I() });

      const expected = { 'team/mfe1': MOCK_REMOTE_INFO_I() };

      const keyA = entry.get()!;
      keyA['team/mfe1'] = MOCK_REMOTE_INFO_II();

      expect(entry.get()).toEqual(expected);
    });
  });

  describe('set', () => {
    it('set stores value in globalThis namespace', () => {
      const entry = storageEntryHandler<Record<string, RemoteInfo>>('remotes', {
        'team/mfe1': MOCK_REMOTE_INFO_I(),
      });
      const expected = { 'team/mfe2': MOCK_REMOTE_INFO_II() };

      entry.set({ 'team/mfe2': MOCK_REMOTE_INFO_II() });

      expect(entry.get()).toEqual(expected);
    });

    it('not allow any mutations', () => {
      const entry = storageEntryHandler('remotes', { 'team/mfe1': MOCK_REMOTE_INFO_I() });
      const newEntry = { 'team/mfe2': MOCK_REMOTE_INFO_II() } as any;
      entry.set(newEntry);

      newEntry['MALICOUS_INJECT'] = 'BAD_SCRIPT.js';

      expect(entry.get()).toEqual({ 'team/mfe2': MOCK_REMOTE_INFO_II() });
    });
  });

  describe('clear', () => {
    it('clears the entry back to the initialValue', () => {
      (globalThis as any)['namespace'] = {};
      (globalThis as any)['namespace']['remotes'] = { 'team/mfe1': MOCK_REMOTE_INFO_I() };

      const entry = storageEntryHandler<Record<string, RemoteInfo>>('remotes', {});

      expect(entry.get()).toEqual({ 'team/mfe1': MOCK_REMOTE_INFO_I() });

      entry.clear();

      expect(entry.get()).toEqual({});
    });
  });
});
