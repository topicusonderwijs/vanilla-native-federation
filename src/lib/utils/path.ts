const getDir = (url: string): string => {
    const parts = url.split('/');
    parts.pop();
    return parts.join('/');
}

const join = (pathA: string, pathB: string): string => {
    pathA = (pathA.startsWith('/')) ? pathA.slice(1) : pathA;
    pathB = (pathB.endsWith('/')) ? pathB.slice(0, -1) : pathB;
    return `${pathA}/${pathB}`;
}

export {getDir, join}