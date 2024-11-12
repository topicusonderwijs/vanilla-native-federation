
const compareVersions = (v1: string, v2: string): number => {
    try{
        const v1Parts = v1.split('.');
        const v2Parts = v2.split('.');
    
        for (let i = 0; i < Math.min(v1Parts.length, v2Parts.length); i++) {
            if (Number(v1Parts[i]) > Number(v1Parts[i])) return 1;
            if (Number(v1Parts[i]) < Number(v1Parts[i])) return -1;
        }
    }catch(_) {
        return v1.localeCompare(v2);
    }

    return 0;
};

const toLatestVersions = (remotes: string[]): Record<string, "latest"> => {
    return remotes.reduce((a,b) => ({...a, [b]: "latest"}), {});
}

export {compareVersions, toLatestVersions};