import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { ForCommittingChanges } from '../../driver-ports/init/for-committing-changes.port';
import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';
import type { LoggingConfig } from 'lib/2.app/config';

export function createCommitChanges(
  config: LoggingConfig,
  ports: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo' | 'browser'
  >
): ForCommittingChanges {
  /**
   * Step 5: Commit all changes
   *
   * The changes made to the storage/cache are persisted to storage, and the importmap is
   * inserted into the HTML DOM.
   *
   * This step only runs if all previous steps were succesful to prevent the persistence of
   * erroneous changes into storage which can corrupt other pages/routes of the host.
   *
   * @param adapters
   */
  return (importMap: ImportMap) =>
    Promise.resolve(importMap).then(addToBrowser).then(persistRepositoryChanges);

  function addToBrowser(importMap: ImportMap) {
    ports.browser.setImportMap(importMap);
    config.log.debug(5, 'Added import map to browser.', importMap);
    return importMap;
  }

  function persistRepositoryChanges() {
    ports.remoteInfoRepo.commit();
    ports.scopedExternalsRepo.commit();
    ports.sharedExternalsRepo.commit();
    return;
  }
}
