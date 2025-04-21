import type { DrivingContract } from "./driving-ports/driving.contract";
import type { ForCommittingChanges } from "./driver-ports/for-committing-changes.port";
import type { ImportMap } from "lib/1.domain/import-map/import-map.contract";

const createCommitChanges = (
    { remoteInfoRepo, sharedExternalsRepo, scopedExternalsRepo, browser }: Pick<DrivingContract, 'remoteInfoRepo'|'scopedExternalsRepo'|'sharedExternalsRepo'|'browser'>
): ForCommittingChanges => { 

    function addToBrowser(importMap: ImportMap) {
        browser.setImportMap(importMap);
        return importMap;
    }

    function persistRepositoryChanges() {
        remoteInfoRepo.commit();
        scopedExternalsRepo.commit();
        sharedExternalsRepo.commit();
        return;
    }

    return (importMap: ImportMap) => Promise.resolve(importMap)
        .then(addToBrowser)
        .then(persistRepositoryChanges)
};

export { createCommitChanges }