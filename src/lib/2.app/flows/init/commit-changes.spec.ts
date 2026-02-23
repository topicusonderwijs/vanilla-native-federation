import { LoggingConfig } from 'lib/options.index';
import { ForCommittingChanges } from '../../driver-ports/init/for-committing-changes.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createCommitChanges } from './commit-changes';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { mockConfig } from 'lib/6.mocks/config.mock';

describe('createCommitChanges', () => {
  let commitChanges: ForCommittingChanges;
  let config: LoggingConfig;
  let adapters: DrivingContract;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();
    commitChanges = createCommitChanges(config, adapters);
  });

  it('should persist all made changes in the repositories', async () => {
    await commitChanges({ imports: {} });

    expect(adapters.remoteInfoRepo.commit).toHaveBeenCalled();
    expect(adapters.scopedExternalsRepo.commit).toHaveBeenCalled();
    expect(adapters.sharedExternalsRepo.commit).toHaveBeenCalled();
    expect(adapters.sharedChunksRepo.commit).toHaveBeenCalled();
  });

  it('should add the importmap to the browser', async () => {
    await commitChanges({ imports: {} });

    expect(adapters.browser.setImportMapFn).toHaveBeenCalledWith({ imports: {} });
  });
});
