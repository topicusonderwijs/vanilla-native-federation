const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');

const commonConfig = {
  platform: 'browser',
  format: 'esm',
  resolveExtensions: ['.ts', '.js'],
  tsconfig: 'tsconfig.json',
  minify: false,
  treeShaking: true,
  metafile: true,
};

async function getPlugins() {
  const pluginsDir = path.join('src', 'plugins');
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(dir => dir.name);
}

async function getSourceFiles(dir) {
  const getAllFiles = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          return getAllFiles(res);
        }
        return res;
      })
    );
    return files.flat();
  };

  return getAllFiles(dir)
    .then(a => a.filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts')))
}

async function generateBuilds() {
  const plugins = await getPlugins();
  
  const builds = {
    esm2022: {
      ...commonConfig,
      entryPoints: await Promise.all([getSourceFiles('src/lib'), getSourceFiles('src/plugins')]).then(dirs => dirs.flat()),
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

  return builds;
}

async function generatePackageExports() {
  const plugins = await getPlugins();
  
  const exports = {
    "./package.json": { default: "./package.json" },
    ".": {
      types: "./index.d.ts",
      esm2022: "./esm2022/vanilla-native-federation.mjs",
      esm: "./esm2022/vanilla-native-federation.mjs",
      default: "./fesm2022/vanilla-native-federation.mjs",
    },
  };

  // Add exports for each plugin
  for (const plugin of plugins) {
    exports[`./plugins/${plugin}`] = {
      types: `./plugins/${plugin}/index.d.ts`,
      esm2022: `./esm2022/vanilla-native-federation-${plugin}.mjs`,
      esm: `./esm2022/vanilla-native-federation-${plugin}.mjs`,
      default: `./fesm2022/vanilla-native-federation-${plugin}.mjs`,
    };
  }

  return {
    exports,
    module: './fesm2022/vanilla-native-federation.mjs',
    typings: 'index.d.ts',
    type: 'module',
  };
}

async function generateTypes() {
  console.log('📝 Generating declaration files..');
  try {
    execSync('tsc -p tsconfig.json', { stdio: 'inherit' });
    console.log('✓ Types generated');
  } catch (error) {
    throw new Error('Failed to generate declaration files: ' + error.message);
  }
}

async function updatePackageJson() {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
  const packageUpdates = await generatePackageExports();
  
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
  console.log('🧹 Tidying up.');
  await fs.rm('dist', { force: true, recursive: true });
  console.log('✓ Removed dist folders');
  await fs.mkdir('dist/fesm2022', { recursive: true });
  await fs.mkdir('dist/esm2022', { recursive: true });
  console.log('✓ Created new dist folders');


}

async function build() {
  try {
    console.log('🚀 Starting build...');
    
    await setupDist();
    await generateTypes();
    
    const builds = await generateBuilds();
    
    await Promise.all(
      Object.entries(builds).map(([name, config]) =>
        esbuild.build(config).then(() => console.log(`✓ ${name} built`))
      )
    );
    
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