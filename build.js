const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');

const commonConfig = {
  platform: 'browser',
  format: 'esm',
  mainFields: ['es2022', 'es2020', 'browser', 'module', 'main'],
  conditions: ['es2022', 'es2020', 'module'],
  resolveExtensions: ['.ts', '.js'],
  tsconfig: 'tsconfig.json',
  minify: false,
  treeShaking: true,
  metafile: true,
};

const builds = {
  esm2022: {
    ...commonConfig,
    entryPoints: ['src/**/*.ts'],
    outdir: 'dist/esm2022',
    bundle: false,
    outExtension: { '.js': '.mjs' },
    sourcemap: false,
  },
  fesm2022: {
    ...commonConfig,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/fesm2022/vanilla-native-federation.mjs',
    bundle: true,
    sourcemap: true,
  },
};

const packageUpdates = {
  exports: {
    "./package.json": { default: "./package.json" },
    ".": {
      types: "./index.d.ts",
      esm2022: "./esm2022/vanilla-native-federation.mjs",
      esm: "./esm2022/vanilla-native-federation.mjs",
      default: "./fesm2022/vanilla-native-federation.mjs",
    },
  },
  module: './fesm2022/vanilla-native-federation.mjs',
  typings: 'index.d.ts',
  type: 'module',
};

async function generateTypes() {
  console.log('📝 Generating declaration files...');
  try {
    execSync('tsc -p tsconfig.json', { stdio: 'inherit' });
    console.log('✓ Types generated');
  } catch (error) {
    throw new Error('Failed to generate declaration files: ' + error.message);
  }
}

async function updatePackageJson() {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
  const updatedPkg = {
    ...pkg,
    ...packageUpdates,
  };
  delete updatedPkg.scripts;
  delete updatedPkg.devDependencies;
  
  await fs.writeFile(
    'dist/package.json',
    JSON.stringify(updatedPkg, null, 2)
  );
}

async function copyFiles() {
  const files = ['README.md', 'LICENSE.md'];
  await Promise.all(
    files.map(async file => {
      try {
        await fs.copyFile(file, `dist/${file}`);
      } catch (error) {
        console.warn(`Warning: Could not copy ${file}`);
      }
    })
  );
}

async function setupDist() {
  await fs.rm('dist', { force: true, recursive: true });
  await fs.mkdir('dist/fesm2022', { recursive: true });
  await fs.mkdir('dist/esm2022', { recursive: true });
}

async function build() {
  try {
    console.log('🚀 Starting build...');
    
    await setupDist();
    await generateTypes();
    
    await Promise.all([
      esbuild.build(builds.esm2022).then(() => console.log('✓ ESM2022 built')),
      esbuild.build(builds.fesm2022).then(() => console.log('✓ FESM2022 built')),
    ]);
    
    await Promise.all([
      updatePackageJson(),
      copyFiles(),
    ]);
    
    console.log('✨ Build complete!');
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

build();