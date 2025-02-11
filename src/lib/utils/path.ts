const getDir = (url: string): string => {
    const parts = url.split('/');
    parts.pop();
    return parts.join('/');
}

const join = (pathA: string, pathB: string): string => {
    pathA = (pathA.endsWith('/')) ? pathA.slice(0, -1) : pathA;
    pathB = (pathB.startsWith('/')) ? pathB.slice(1) : pathB;
    return `${pathA}/${pathB}`;
}

export {getDir, join}