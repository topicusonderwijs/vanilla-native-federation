import { ForCommittingChanges } from '../driver-ports/for-committing-changes.port';
import { DrivingContract } from '../driving-ports/driving.contract';
import { createCommitChanges } from './commit-changes';
import { mockRemoteInfoRepository } from 'lib/6.mocks/adapters/remote-info.repository.mock';
import { mockSharedExternalsRepository } from 'lib/6.mocks/adapters/shared-externals.repository.mock';
import { mockScopedExternalsRepository } from 'lib/6.mocks/adapters/scoped-externals.repository.mock';
import { mockBrowser } from 'lib/6.mocks/adapters/browser.mock';

describe('createCommitChanges', () => {
  let commitChanges: ForCommittingChanges;
  let mockAdapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo' | 'browser'
  >;

  beforeEach(() => {
    mockAdapters = {
      remoteInfoRepo: mockRemoteInfoRepository(),
      sharedExternalsRepo: mockSharedExternalsRepository(),
      scopedExternalsRepo: mockScopedExternalsRepository(),
      browser: mockBrowser(),
    };

    commitChanges = createCommitChanges(mockAdapters);
  });

  it('should persist all made changes in the repositories', async () => {
    await commitChanges({ imports: {} });

    expect(mockAdapters.remoteInfoRepo.commit).toHaveBeenCalled();
    expect(mockAdapters.scopedExternalsRepo.commit).toHaveBeenCalled();
    expect(mockAdapters.sharedExternalsRepo.commit).toHaveBeenCalled();
  });

  it('should add the importmap to the browser', async () => {
    await commitChanges({ imports: {} });

    expect(mockAdapters.browser.setImportMap).toHaveBeenCalledWith({ imports: {} });
  });
});
