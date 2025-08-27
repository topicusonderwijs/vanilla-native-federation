const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');

const PATHS = {
  src: 'src',
  dist: 'dist',
  lib: path.join('src', 'lib'),
  quickstart: path.join('src'),
  tsconfigTypes: 'tsconfig.build.json',
};

const OUTPUT_PATHS = {
  fesm2022: path.join('dist', 'fesm2022'),
  quickstart: path.join('dist')
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
  minify: false,
  treeShaking: true,
  metafile: true,
  splitting: false,
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
  }
};

async function generateBundles() {
  const baseConfig = createBaseConfig();
  
  const builds = {
    'vanilla-native-federation': {
      ...baseConfig,
      entryPoints: ['src/lib/index.ts'],
      outfile: path.join(OUTPUT_PATHS.fesm2022, `${PACKAGE_NAME}.mjs`),
      bundle: true,
      sourcemap: true
    },
    
    'vanilla-native-federation/sdk': {
      ...baseConfig,
      entryPoints: ['src/lib/sdk.index.ts'],
      outfile: path.join(OUTPUT_PATHS.fesm2022, 'sdk.mjs'),
      bundle: true,
      sourcemap: true
    },
    
    'vanilla-native-federation/options': {
      ...baseConfig,
      entryPoints: ['src/lib/options.index.ts'],
      outfile: path.join(OUTPUT_PATHS.fesm2022, 'options.mjs'),
      bundle: true,
      sourcemap: true
    },

    'quickstart': {
      ...baseConfig,
      entryPoints: [path.join(PATHS.quickstart, "quickstart.ts")],
      outfile: path.join(OUTPUT_PATHS.quickstart, `quickstart.mjs`),
      bundle: true,
      sourcemap: false,
      minify: true
    }
  };

  return builds;
}

function generatePackageExports() {
  return {
    exports: {
      "./package.json": { "default": "./package.json" },
      "./quickstart.mjs": {
        "default": "./quickstart.mjs"
      },

      ".": {
        "types": "./types/lib/index.d.ts",
        "default": "./fesm2022/vanilla-native-federation.mjs"
      },
      
      "./sdk": {
        "types": "./types/lib/sdk.index.d.ts", 
        "default": "./fesm2022/sdk.mjs"
      },
      
      "./options": {
        "types": "./types/lib/options.index.d.ts",
        "default": "./fesm2022/options.mjs"
      }
    },
    
    typings: "./types/lib/index.d.ts",
    module: './fesm2022/vanilla-native-federation.mjs', 
    type: 'module',
    sideEffects: false
  };
}

async function generateTypes() {
  logger.info('Generating declaration files...');
  try {
    execSync(`tsc -p ${PATHS.tsconfigTypes}`, { stdio: 'inherit' });
    logger.success('Types generated');
    
    // Post-process declaration files to fix lib/ imports
    await fixDeclarationImports();
    
    return true;
  } catch (err) {
    throw new Error(`Failed to generate declaration files: ${err.message}`);
  }
}

async function fixDeclarationImports() {
  logger.info('Fixing declaration file imports...');
  
  const glob = require('util').promisify(require('child_process').exec);
  
  try {
    // Find all .d.ts files in the dist/types directory
    const { stdout } = await glob('find dist/types -name "*.d.ts"');
    const files = stdout.trim().split('\n').filter(f => f);
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        
        // Replace lib/ imports with relative imports
        const updatedContent = content.replace(
          /from ['"]lib\//g,
          (match, ...args) => {
            // Calculate relative path from current file to lib directory
            const relativePath = path.relative(
              path.dirname(filePath), 
              path.join('dist/types/lib')
            );
            return `from '${relativePath}/`;
          }
        );
        
        if (content !== updatedContent) {
          await fs.writeFile(filePath, updatedContent, 'utf8');
        }
      } catch (err) {
        logger.warn(`Could not process ${filePath}: ${err.message}`);
      }
    }
    
    logger.success('Declaration imports fixed');
  } catch (err) {
    logger.warn(`Could not fix declaration imports: ${err.message}`);
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
    OUTPUT_PATHS.fesm2022,
    OUTPUT_PATHS.quickstart
  ];
  
  const dirResults = await Promise.all(dirs.map(dir => fsUtils.ensureDir(dir)));
  return dirResults.every(Boolean);
}

async function runBuilds(configs) {
  const buildPromises = Object.entries(configs).map(async ([name, config]) => {
    try {
      const result = await esbuild.build(config);
      
      if (result.metafile && config.outfile) {
        const { outputs } = result.metafile;
        const outputFile = Object.keys(outputs)[0];
        if (outputFile) {
          const sizeKB = (outputs[outputFile].bytes / 1024).toFixed(1);
          logger.success(`${name}: ${sizeKB}KB`);
        }
      }
      
      return true;
    } catch (err) {
      logger.error(`❌ ${name}: ${err.message}`);
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
    
    await Promise.all([
      generateTypes(),
      (async () => {
        const bundleConfigs = await generateBundles();
        await runBuilds(bundleConfigs);
      })()
    ]);
    
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