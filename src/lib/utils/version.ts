
const compareVersions = (v1: string, v2: string): number => {
    try{
        // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
        const isSemver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
        if(!isSemver.test(v1) || !isSemver.test(v2)){
            throw Error("Version is not SEMVER");
        }

        const v1Parts = v1.split(/[.-]+/);
        const v2Parts = v2.split(/[.-]+/);

        // Check numeric part (1.1.0)
        for (let i = 0; i < 3; i++) {
            v1Parts[i] ??= "";
            v2Parts[i] ??= "";

            if (Number(v1Parts[i]) > Number(v2Parts[i])) return 1;
            if (Number(v1Parts[i]) < Number(v2Parts[i])) return -1;
        }

        // Check flags like 1.1.0-patch
        let vDiff = 0, idx=3;
        while(vDiff === 0) {
            if(!v1Parts[idx] && !v2Parts[idx]) return 0;
            if(!v2Parts[idx]) return 1;
            if(!v1Parts[idx]) return -1;

            vDiff = (v1Parts[idx]!).localeCompare(v2Parts[idx]!);
            idx++;
        }
        return vDiff;
    }catch(_) {
        return v1.localeCompare(v2);
    }
};

const addLatestTag = (remotes: string[]): Record<string, "latest"> => {
    return remotes.reduce((a,b) => ({...a, [b]: "latest"}), {});
}

const getLatestVersion = (versions: string[]): string|undefined => {
    return versions.sort(compareVersions).at(-1);
}

const getLatestVersionBefore = (versions: string[], latest: string): string|undefined => {
    return versions
        .filter(v => compareVersions(v, latest) < 0)
        .sort(compareVersions).at(-1);
}


export {compareVersions, addLatestTag, getLatestVersion, getLatestVersionBefore};