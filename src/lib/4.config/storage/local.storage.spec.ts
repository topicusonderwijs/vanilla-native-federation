import { StorageEntryHandler } from 'lib/2.app/config/storage.contract';
import { localStorageEntry } from './local.storage';
import {
  MOCK_REMOTE_INFO_I,
  MOCK_REMOTE_INFO_II,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { RemoteInfo } from 'lib/1.domain/remote/remote-info.contract';

describe('localStorageEntry', () => {
  let mockStorage: any;
  let storageEntryHandler: StorageEntryHandler;
  beforeEach(() => {
    mockStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
      },
    });
    storageEntryHandler = localStorageEntry('namespace');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Create entry with default value on init', () => {
    storageEntryHandler('remotes', { 'team/mfe1': MOCK_REMOTE_INFO_I() });

    expect(mockStorage[`${'namespace'}.remotes`]).toBeDefined();
    expect(JSON.parse(mockStorage[`${'namespace'}.remotes`])).toEqual({
      'team/mfe1': MOCK_REMOTE_INFO_I(),
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
    it('set stores value in namespace', () => {
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
      mockStorage[`${'namespace'}.remotes`] = JSON.stringify({ 'team/mfe1': MOCK_REMOTE_INFO_I() });

      const entry = storageEntryHandler<Record<string, RemoteInfo>>('remotes', {});

      expect(entry.get()).toEqual({ 'team/mfe1': MOCK_REMOTE_INFO_I() });

      entry.clear();

      expect(entry.get()).toEqual({});
    });
  });
});
