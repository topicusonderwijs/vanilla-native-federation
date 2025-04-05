import type { ForResolvingPaths } from "lib/2.app/driving-ports/for-resolving-paths.port";

const createPathResolver = (): ForResolvingPaths => {

    function join(pathA: string, pathB: string)
        : string {
            pathA = (pathA.endsWith('/')) ? pathA.slice(0, -1) : pathA;
            pathB = (pathB.startsWith('/')) ? pathB.slice(1) : pathB;
            return `${pathA}/${pathB}`;
        }
    
    function getScope(path: string) {
        if (!path) return '';
        
        const parts = path.split("/");
        if (parts.length < 1) return "";
    
        if (parts[parts.length - 1] === "" || parts[parts.length - 1]!.includes('.')) {
            parts.pop();
        }
        if (parts.length < 1) return "";
    
        return `${parts.join('/')}/`;
    }
    
    return {
        getScope, join
    }
}

export { createPathResolver }