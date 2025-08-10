import { createRemoteInfoRepository } from './remote-info.repository';
import { Optional } from 'lib/utils/optional';
import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { StorageConfig } from 'lib/2.app/config';
import { RemoteInfo } from 'lib/1.domain';
import {
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { mockScopeUrl_MFE1 } from 'lib/6.mocks/domain/scope-url.mock';

describe('createRemoteInfoRepository', () => {
  const setupWithCache = (storage: any) => {
    const mockStorage = { remotes: storage };
    const mockStorageEntry = createStorageHandlerMock(mockStorage);

    const mockConfig: StorageConfig = {
      storage: mockStorageEntry,
      clearStorage: false,
    };
    const remoteInfoRepo = createRemoteInfoRepository(mockConfig);
    return { mockStorage, mockStorageEntry, remoteInfoRepo };
  };

  describe('initialization', () => {
    it('should initialize the entry with the first value', () => {
      const { mockStorage } = setupWithCache(undefined);
      expect(mockStorage['remotes']).toEqual({});
    });

    it('should reset cache when in config', () => {
      const mockStorage = {
        remotes: {
          'team/mfe1': mockRemoteInfo_MFE1(),
        },
      };
      const mockStorageEntry = createStorageHandlerMock(mockStorage);
      const mockConfig: StorageConfig = {
        storage: mockStorageEntry,
        clearStorage: true,
      };
      createRemoteInfoRepository(mockConfig);

      expect(mockStorage['remotes']).toEqual({});
    });
  });

  describe('contains', () => {
    it('should return false when empty', () => {
      const { remoteInfoRepo } = setupWithCache({});

      const result = remoteInfoRepo.contains('team/mfe1');

      expect(result).toBe(false);
    });

    it('should return true when exists', () => {
      const { remoteInfoRepo } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      const result = remoteInfoRepo.contains('team/mfe1');

      expect(result).toBe(true);
    });

    it('should return false when entry doesnt exist', () => {
      const { remoteInfoRepo } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      const result = remoteInfoRepo.contains('team/mfe2');

      expect(result).toBe(false);
    });

    it('should return false when entry is lost', () => {
      const { remoteInfoRepo } = setupWithCache({});

      const result = remoteInfoRepo.contains('team/mfe2');

      expect(result).toBe(false);
    });
  });

  describe('addOrUpdate', () => {
    it('should not alter storage if not committed', () => {
      const { remoteInfoRepo, mockStorage } = setupWithCache({});

      remoteInfoRepo.addOrUpdate('team/mfe1', mockRemoteInfo_MFE1());

      expect(mockStorage['remotes']).toEqual({});
    });

    it('should update changes after commit', () => {
      const { remoteInfoRepo, mockStorage } = setupWithCache({});

      remoteInfoRepo.addOrUpdate('team/mfe1', mockRemoteInfo_MFE1());
      expect(mockStorage['remotes']).toEqual({});

      remoteInfoRepo.commit();
      expect(mockStorage['remotes']).toEqual({ 'team/mfe1': mockRemoteInfo_MFE1() });
    });

    it('should update if not in list', () => {
      const { remoteInfoRepo, mockStorage } = setupWithCache({ 'team/mfe1': 'MOCK_REMOTE_INFO' });

      remoteInfoRepo.addOrUpdate('team/mfe1', mockRemoteInfo_MFE1());
      remoteInfoRepo.commit();

      expect(mockStorage['remotes']['team/mfe1']).toEqual(mockRemoteInfo_MFE1());
    });

    it('should not affect other entries', () => {
      const { remoteInfoRepo, mockStorage } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      remoteInfoRepo.addOrUpdate('team/mfe2', mockRemoteInfo_MFE2());
      remoteInfoRepo.commit();

      expect(mockStorage['remotes']['team/mfe1']).toEqual(mockRemoteInfo_MFE1());
      expect(mockStorage['remotes']['team/mfe2']).toEqual(mockRemoteInfo_MFE2());
    });

    it('should return the repository instance for chaining', () => {
      const { remoteInfoRepo } = setupWithCache({});
      const result = remoteInfoRepo.addOrUpdate('team/mfe1', mockRemoteInfo_MFE1());
      expect(result).toBe(remoteInfoRepo);
    });
  });
  describe('tryGet', () => {
    it('should return the scopeUrl', () => {
      const { remoteInfoRepo } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      const actual: Optional<RemoteInfo> = remoteInfoRepo.tryGet('team/mfe1');

      expect(actual.isPresent()).toBe(true);
      expect(actual.get()).toEqual({
        exposes: [{ file: 'component-a.js', moduleName: './wc-comp-a' }],
        scopeUrl: 'http://my.service/mfe1/',
      });
    });

    it('should return an empty optional if the remote is not registered.', () => {
      const { remoteInfoRepo } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      const actual: Optional<RemoteInfo> = remoteInfoRepo.tryGet('team/mfe2');

      expect(actual.isPresent()).toBe(false);
    });
  });

  describe('tryGetModule', () => {
    it('should return the exposed module', () => {
      const { remoteInfoRepo } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      const actual: Optional<string> = remoteInfoRepo.tryGetModule('team/mfe1', './wc-comp-a');

      expect(actual.isPresent()).toBe(true);
      expect(actual.get()).toEqual(`${mockScopeUrl_MFE1()}component-a.js`);
    });

    it('should return empty optional if module doesnt exist', () => {
      const { remoteInfoRepo } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      const actual: Optional<string> = remoteInfoRepo.tryGetModule('team/mfe1', './wc-comp-c');

      expect(actual.isPresent()).toBe(false);
    });

    it('should return empty optional if remote-info doesnt exist', () => {
      const { remoteInfoRepo } = setupWithCache({});

      const actual: Optional<string> = remoteInfoRepo.tryGetModule('team/mfe1', './wc-comp-a');

      expect(actual.isPresent()).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all remote infos from the cache', () => {
      const { remoteInfoRepo } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
        'team/mfe2': mockRemoteInfo_MFE2(),
      });

      const allRemoteInfos = remoteInfoRepo.getAll();

      expect(allRemoteInfos).toEqual({
        'team/mfe1': mockRemoteInfo_MFE1(),
        'team/mfe2': mockRemoteInfo_MFE2(),
      });
    });

    it('should return an empty object if no remote infos are cached', () => {
      const { remoteInfoRepo } = setupWithCache({});
      const allRemoteInfos = remoteInfoRepo.getAll();
      expect(allRemoteInfos).toEqual({});
    });
  });

  describe('remove', () => {
    it('should remove a remoteEntry scope from the cache', () => {
      const { remoteInfoRepo, mockStorage } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
      });

      remoteInfoRepo.remove('team/mfe1');
      remoteInfoRepo.commit();

      expect(mockStorage['remotes']).toEqual({});
    });

    it('should not remove other remoteEntry scope', () => {
      const { remoteInfoRepo, mockStorage } = setupWithCache({
        'team/mfe1': mockRemoteInfo_MFE1(),
        'team/mfe2': mockRemoteInfo_MFE2(),
      });

      remoteInfoRepo.remove('team/mfe1');
      remoteInfoRepo.commit();

      expect(mockStorage['remotes']).toEqual({
        'team/mfe2': mockRemoteInfo_MFE2(),
      });
    });

    it('should return the repository instance for chaining', () => {
      const { remoteInfoRepo } = setupWithCache({});
      const result = remoteInfoRepo.remove('scope-a');
      expect(result).toBe(remoteInfoRepo);
    });
  });
});
