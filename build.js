const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');

const PATHS = {
  src: 'src',
  dist: 'dist',
  lib: path.join('src', 'lib'),
  quickstart: path.join('src', 'quickstart'),
  tsconfigFile: 'tsconfig.build.json',
};

const OUTPUT_PATHS = {
  esm2022: path.join('dist', 'esm2022'),
  fesm2022: path.join('dist', 'fesm2022'),
  quickstart: path.join('dist', 'quickstart')
};

const FILES_TO_COPY = ['README.md', 'LICENSE.md'];
const PACKAGE_NAME = 'vanilla-native-federation';

const logger = {
  info: msg => console.log(`ℹ️ ${msg}`),
  success: msg => console.log(`✅ ${msg}`),
  warn: msg => console.warn(`⚠️ ${msg}`),
  error: msg => console.error(`❌ ${msg}`),
  start: msg => console.log(`🚀 ${msg}`),
  complete: msg => console.log(`✨ ${msg}`)
};

const createBaseConfig = () => ({
  platform: 'browser',
  format: 'esm',
  resolveExtensions: ['.ts', '.js'],
  tsconfig: PATHS.tsconfigFile,
  minify: false,
  treeShaking: true,
  metafile: true
});

const fsUtils = {
  ensureDir: async (dir) => {
    try {
      await fs.mkdir(dir, { recursive: true });
      return true;
    } catch (err) {
      logger.warn(`Could not create ${dir}: ${err.message}`);
      return false;
    }
  },
  removeDir: async (dir) => {
    try {
      await fs.rm(dir, { force: true, recursive: true });
      return true;
    } catch (err) {
      logger.warn(`Could not remove ${dir}: ${err.message}`);
      return false;
    }
  },
  copyFile: async (src, dest) => {
    try {
      await fs.copyFile(src, dest);
      return true;
    } catch (err) {
      logger.warn(`Could not copy ${src}: ${err.message}`);
      return false;
    }
  },
  
  getSourceFiles: async (dir) => {
    const getAllFiles = async (directory) => {
      try {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        const filePromises = entries.map(entry => {
          const fullPath = path.resolve(directory, entry.name);
          return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
        });
        
        const nestedFiles = await Promise.all(filePromises);
        return nestedFiles.flat();
      } catch (err) {
        logger.warn(`Error reading ${directory}: ${err.message}`);
        return [];
      }
    };

    const allFiles = await getAllFiles(dir);
    return allFiles.filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts'));
  },
  
  getQuickstarts: async () => {
    try {
      const entries = await fs.readdir(PATHS.quickstart, { withFileTypes: true });
      return entries.map(file => file.name);
    } catch (err) {
      logger.warn(`Failed to read quickstarts: ${err.message}`);
      return [];
    }
  }
};


async function generateBuildConfigs() {
  const baseConfig = createBaseConfig();
  const sourceFiles = await fsUtils.getSourceFiles(PATHS.lib);
  const quickstarts = await fsUtils.getQuickstarts();
  
  const builds = {
    esm2022: {
      ...baseConfig,
      entryPoints: sourceFiles,
      outdir: OUTPUT_PATHS.esm2022,
      bundle: false,
      outExtension: { '.js': '.mjs' },
      sourcemap: false
    },
    fesm2022: {
      ...baseConfig,
      entryPoints: ['src/lib/index.ts'],
      outfile: path.join(OUTPUT_PATHS.fesm2022, `${PACKAGE_NAME}.mjs`),
      bundle: true,
      sourcemap: true
    }
  };

  for (const quickstart of quickstarts) {
    const outputName = quickstart.slice(0, -3); 
    builds[`quickstart/${quickstart}`] = {
      ...baseConfig,
      entryPoints: [path.join(PATHS.quickstart, quickstart)],
      outfile: path.join(OUTPUT_PATHS.quickstart, `${outputName}.mjs`),
      bundle: true,
      sourcemap: true,
      minify: true,
      metafile: false
    };
  }

  return builds;
}

function generatePackageExports() {
  return {
    exports: {
      "./package.json": {default: "./package.json"},
      ".": {
        types: "./types/lib/index.d.ts",
        esm: "./esm2022/index.mjs",
        default: "./fesm2022/vanilla-native-federation.mjs"
      },
    },
    typings: "types/lib/index.d.ts",
    module: './fesm2022/vanilla-native-federation.mjs',
    type: 'module'
  };
}

async function generateTypes() {
  logger.info('Generating declaration files...');
  try {
    execSync(`tsc -p ${PATHS.tsconfigFile}`, { stdio: 'inherit' });
    logger.success('Types generated');
    return true;
  } catch (err) {
    throw new Error(`Failed to generate declaration files: ${err.message}`);
  }
}

async function updatePackageJson() {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const packageUpdates = generatePackageExports();
    
    const distPkg = { ...pkg, ...packageUpdates };
    delete distPkg.scripts;
    delete distPkg.devDependencies;

    await fs.writeFile(
      path.join(PATHS.dist, 'package.json'),
      JSON.stringify(distPkg, null, 2)
    );
    return true;
  } catch (err) {
    logger.error(`Failed to update package.json: ${err.message}`);
    return false;
  }
}

async function setupDistDirectory() {
  await fsUtils.removeDir(PATHS.dist);
  
  const dirs = [
    PATHS.dist, 
    OUTPUT_PATHS.esm2022, 
    OUTPUT_PATHS.fesm2022,
    OUTPUT_PATHS.quickstart
  ];
  
  const dirResults = await Promise.all(dirs.map(dir => fsUtils.ensureDir(dir)));
  return dirResults.every(Boolean);
}

async function runBuilds(configs) {
  const buildPromises = Object.entries(configs).map(async ([name, config]) => {
    try {
      await esbuild.build(config);
      logger.success(`Build "${name}" completed`);
      return true;
    } catch (err) {
      logger.error(`Build "${name}" failed: ${err.message}`);
      return false;
    }
  });
  
  const results = await Promise.all(buildPromises);
  return results.every(Boolean);
}

async function copyProjectFiles() {
  const copyPromises = FILES_TO_COPY.map(file => 
    fsUtils.copyFile(file, path.join(PATHS.dist, file))
  );
  
  await Promise.all(copyPromises);
}

async function build() {
  try {
    logger.start('Starting build...');
    
    await setupDistDirectory();
    await generateTypes();
    
    const buildConfigs = await generateBuildConfigs();
    await runBuilds(buildConfigs);
    
    await Promise.all([
      updatePackageJson(),
      copyProjectFiles()
    ]);
    
    logger.complete('Build successful!');
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();