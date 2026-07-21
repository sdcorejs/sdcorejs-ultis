#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const temporaryPrefix = 'sdcorejs-utils-package-';
const supportedModes = new Map([
  ['--runtime', 'runtime'],
  ['--types', 'types'],
  ['--browser', 'browser'],
  ['--examples', 'examples'],
]);

const requestedModes = new Set();
for (const argument of process.argv.slice(2)) {
  const mode = supportedModes.get(argument);
  if (!mode) {
    throw new Error(`Unknown package-validation option: ${argument}`);
  }
  requestedModes.add(mode);
}
if (requestedModes.size === 0) {
  for (const mode of supportedModes.values()) requestedModes.add(mode);
}

const temporaryRoot = await mkdtemp(join(tmpdir(), temporaryPrefix));

try {
  await assertBuildExists();
  const tarballPath = await createTarball(temporaryRoot);
  const consumerRoot = await installTarball(temporaryRoot, tarballPath);
  const installedPackageRoot = join(
    consumerRoot,
    'node_modules',
    '@sdcorejs',
    'utils',
  );

  await validateInstalledPackage(installedPackageRoot, consumerRoot);

  if (requestedModes.has('types')) {
    await validateTypeDeclarations(consumerRoot);
  }
  if (requestedModes.has('browser')) {
    await validateBrowserBundle(consumerRoot);
  }
  if (requestedModes.has('examples')) {
    await validateExamples(consumerRoot);
  }
  if (requestedModes.has('runtime')) {
    await validateRuntimeImports(consumerRoot);
  }

  console.log(
    `[package-validation] PASS (${[...requestedModes].join(', ')})`,
  );
} finally {
  await removeTemporaryRoot(temporaryRoot);
}

async function assertBuildExists() {
  const requiredArtifacts = [
    'index.js',
    'index.cjs',
    'index.d.ts',
    'index.d.cts',
    'models.js',
    'models.cjs',
    'constants.js',
    'constants.cjs',
    'fns.js',
    'fns.cjs',
    'errors.js',
    'errors.cjs',
    'errors.d.ts',
    'errors.d.cts',
  ];

  const missing = requiredArtifacts.filter(
    artifact => !existsSync(join(repositoryRoot, 'dist', artifact)),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing build artifacts (${missing.join(', ')}). Run npm run build first.`,
    );
  }
}

async function createTarball(root) {
  const packDirectory = join(root, 'pack');
  await mkdir(packDirectory);
  const output = runNpm(
    [
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      packDirectory,
    ],
    { cwd: repositoryRoot, capture: true },
  );

  let packResult;
  try {
    packResult = JSON.parse(output);
  } catch (error) {
    throw new Error(`npm pack did not return JSON: ${output}`, { cause: error });
  }

  assert.equal(packResult.length, 1, 'npm pack must produce exactly one package');
  const tarballPath = join(packDirectory, basename(packResult[0].filename));
  await access(tarballPath);
  console.log(`[package-validation] packed ${packResult[0].id}`);
  return tarballPath;
}

async function installTarball(root, tarballPath) {
  const consumerRoot = join(root, 'consumer');
  await mkdir(consumerRoot);
  await writeJson(join(consumerRoot, 'package.json'), {
    name: 'sdcorejs-utils-package-consumer',
    private: true,
    type: 'module',
  });

  runNpm(
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      '--save-exact',
      tarballPath,
    ],
    { cwd: consumerRoot },
  );
  return consumerRoot;
}

async function validateInstalledPackage(packageRoot, consumerRoot) {
  const manifest = JSON.parse(
    await readFile(join(packageRoot, 'package.json'), 'utf8'),
  );
  assert.equal(manifest.name, '@sdcorejs/utils');
  assert.equal(manifest.sideEffects, false);
  assert.deepEqual(Object.keys(manifest.exports).sort(), [
    '.',
    './constants',
    './errors',
    './fns',
    './models',
  ]);
  for (const publicDocument of [
    'CHANGELOG.md',
    'MIGRATION-1.2.md',
    'SECURITY.md',
    'RELEASE_NOTES-1.2.0.md',
  ]) {
    await access(join(packageRoot, publicDocument));
  }
  for (const privatePath of ['src', 'scripts', 'examples', '.github']) {
    assert.equal(
      existsSync(join(packageRoot, privatePath)),
      false,
      `packed package must not expose ${privatePath}/`,
    );
  }

  for (const [subpath, conditions] of Object.entries(manifest.exports)) {
    for (const environment of ['import', 'require']) {
      assert.equal(
        typeof conditions[environment],
        'object',
        `${subpath} must provide nested ${environment} conditions`,
      );
      for (const condition of ['types', 'default']) {
        const target = conditions[environment][condition];
        assert.equal(
          typeof target,
          'string',
          `${subpath} ${environment}.${condition} must be a path`,
        );
        await access(resolveExportTarget(packageRoot, target));
      }
    }
  }

  for (const dependencyField of [
    'dependencies',
    'optionalDependencies',
    'peerDependencies',
    'devDependencies',
  ]) {
    assert.equal(
      Object.hasOwn(manifest[dependencyField] ?? {}, 'rxjs'),
      false,
      `packed manifest must not declare rxjs in ${dependencyField}`,
    );
  }
  assert.equal(
    existsSync(join(consumerRoot, 'node_modules', 'rxjs')),
    false,
    'the isolated consumer must not install RxJS',
  );

  const distFiles = await listFilesRecursively(join(packageRoot, 'dist'));
  const rxjsReferencePattern = /(?:from\s*["']rxjs(?:\/[^"']*)?["']|require\(\s*["']rxjs(?:\/[^"']*)?["']\s*\)|import\s*["']rxjs(?:\/[^"']*)?["'])/;
  for (const filePath of distFiles) {
    if (!/\.(?:[cm]?js|d\.[cm]?ts)$/.test(filePath)) continue;
    const content = await readFile(filePath, 'utf8');
    assert.equal(
      rxjsReferencePattern.test(content),
      false,
      `packed artifact contains a runtime/type RxJS dependency: ${relative(packageRoot, filePath)}`,
    );
  }
  for (const declarationName of ['fns.d.ts', 'fns.d.cts']) {
    const declaration = await readFile(join(packageRoot, 'dist', declarationName), 'utf8');
    for (const property of ['encrypt', 'decrypt', 'hash', 'isNumber', 'isImageUrl']) {
      assertDeprecatedObjectProperties(declaration, property, declarationName);
    }
  }
  console.log('[package-validation] package structure and no-RxJS proof passed');
}

async function validateRuntimeImports(consumerRoot) {
  const esmFile = join(consumerRoot, 'runtime-smoke.mjs');
  const cjsFile = join(consumerRoot, 'runtime-smoke.cjs');
  await writeFile(
    esmFile,
    `import assert from 'node:assert/strict';
import * as root from '@sdcorejs/utils';
import * as models from '@sdcorejs/utils/models';
import * as constants from '@sdcorejs/utils/constants';
import * as fns from '@sdcorejs/utils/fns';
import * as errors from '@sdcorejs/utils/errors';

assert.equal(typeof root.DateUtilities, 'object');
assert.equal(typeof models.resolveMaybeAsync, 'function');
assert.equal(typeof constants.EMPTY_STR, 'string');
assert.equal(typeof fns.ValidationUtilities, 'object');
assert.equal(typeof errors.SdcoreUtilsError, 'function');
assert.ok(new root.UnsafeObjectKeyError('__proto__') instanceof errors.SdcoreUtilsError);
assert.ok(new errors.UnsafeObjectKeyError('__proto__') instanceof root.SdcoreUtilsError);
assert.equal(await models.resolveMaybeAsync(Promise.resolve(42)), 42);
`,
  );
  await writeFile(
    cjsFile,
    `const assert = require('node:assert/strict');
const root = require('@sdcorejs/utils');
const models = require('@sdcorejs/utils/models');
const constants = require('@sdcorejs/utils/constants');
const fns = require('@sdcorejs/utils/fns');
const errors = require('@sdcorejs/utils/errors');

assert.equal(typeof root.DateUtilities, 'object');
assert.equal(typeof models.resolveMaybeAsync, 'function');
assert.equal(typeof constants.EMPTY_STR, 'string');
assert.equal(typeof fns.ValidationUtilities, 'object');
assert.equal(typeof errors.SdcoreUtilsError, 'function');
assert.ok(new root.UnsafeObjectKeyError('__proto__') instanceof errors.SdcoreUtilsError);
assert.ok(new errors.UnsafeObjectKeyError('__proto__') instanceof root.SdcoreUtilsError);
`,
  );

  runNode([esmFile], { cwd: consumerRoot });
  runNode([cjsFile], { cwd: consumerRoot });
  console.log('[package-validation] Node ESM and CJS imports passed');

  await validateRxjsCompatibility(consumerRoot);
}

async function validateRxjsCompatibility(consumerRoot) {
  const rxjsVersion = '7.8.2';
  runNpm(
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      '--no-save',
      `rxjs@${rxjsVersion}`,
    ],
    { cwd: consumerRoot },
  );

  const installedRxjs = JSON.parse(
    await readFile(join(consumerRoot, 'node_modules', 'rxjs', 'package.json'), 'utf8'),
  );
  assert.equal(installedRxjs.version, rxjsVersion, 'the RxJS smoke test must use its pinned version');

  const esmFile = join(consumerRoot, 'rxjs-smoke.mjs');
  const cjsFile = join(consumerRoot, 'rxjs-smoke.cjs');
  const typesRoot = join(consumerRoot, 'rxjs-types');
  await mkdir(typesRoot);
  await writeFile(
    esmFile,
    `import assert from 'node:assert/strict';
import { normalizeAsync, resolveMaybeAsync } from '@sdcorejs/utils';
import { firstValueFrom, map, of } from 'rxjs';

assert.equal(await resolveMaybeAsync(of(42)), 42);
assert.equal(await firstValueFrom(normalizeAsync(of(42)).pipe(map(value => value + 1))), 43);
`,
  );
  await writeFile(
    cjsFile,
    `const assert = require('node:assert/strict');
const { normalizeAsync, resolveMaybeAsync } = require('@sdcorejs/utils');
const { firstValueFrom, map, of } = require('rxjs');

(async () => {
  assert.equal(await resolveMaybeAsync(of(42)), 42);
  assert.equal(await firstValueFrom(normalizeAsync(of(42)).pipe(map(value => value + 1))), 43);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
`,
  );
  await writeFile(
    join(typesRoot, 'consumer.mts'),
    `import { normalizeAsync, resolveMaybeAsync, type MaybeAsync, type SubscribableLike } from '@sdcorejs/utils';
import { map, of } from 'rxjs';

const observable = of(42);
const maybe: MaybeAsync<number> = observable;
const structural: SubscribableLike<number> = observable;
const piped = normalizeAsync(observable).pipe(map(value => value + 1));
void [resolveMaybeAsync(maybe), structural, piped];
`,
  );
  await writeFile(
    join(typesRoot, 'consumer.cts'),
    `import root = require('@sdcorejs/utils');
import rxjs = require('rxjs');

const observable = rxjs.of(42);
const maybe: root.MaybeAsync<number> = observable;
const structural: root.SubscribableLike<number> = observable;
const piped = root.normalizeAsync(observable).pipe(rxjs.map(value => value + 1));
void [root.resolveMaybeAsync(maybe), structural, piped];
`,
  );
  await writeJson(join(typesRoot, 'tsconfig.json'), {
    ...typeScriptConfig(),
    include: ['*.mts', '*.cts'],
  });

  runNode([esmFile], { cwd: consumerRoot });
  runNode([cjsFile], { cwd: consumerRoot });
  runTypeScript(join(typesRoot, 'tsconfig.json'), consumerRoot);
  console.log(`[package-validation] ESM and CJS root imports with RxJS ${rxjsVersion} passed`);
}

async function validateTypeDeclarations(consumerRoot) {
  const typeRoot = join(consumerRoot, 'declarations');
  await mkdir(typeRoot);
  await writeFile(
    join(typeRoot, 'consumer.mts'),
    `import {
  DateUtilities,
  SdcoreUtilsError,
  type DetectIncognitoOptions,
  type IncognitoDetectionResult,
  type PagingReq,
} from '@sdcorejs/utils';
import type { PagingRes } from '@sdcorejs/utils/models';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import {
  ValidationUtilities,
  type DetectIncognitoOptions as FnsDetectIncognitoOptions,
  type IncognitoDetectionResult as FnsIncognitoDetectionResult,
} from '@sdcorejs/utils/fns';
import { UnsafeObjectKeyError } from '@sdcorejs/utils/errors';

const request: PagingReq<{ id: number }> = { pageNumber: 0, pageSize: 20 };
const response: PagingRes<{ id: number }> = { items: [{ id: 1 }], total: 1 };
const error: SdcoreUtilsError = new UnsafeObjectKeyError('__proto__');
const incognitoOptions: DetectIncognitoOptions & FnsDetectIncognitoOptions = { timeoutMs: 100 };
const incognitoResult: IncognitoDetectionResult & FnsIncognitoDetectionResult = {
  browserName: 'test',
  isPrivate: false,
};
void [DateUtilities, EMPTY_STR, ValidationUtilities, request, response, error, incognitoOptions, incognitoResult];
`,
  );
  await writeFile(
    join(typeRoot, 'consumer.cts'),
    `import root = require('@sdcorejs/utils');
import models = require('@sdcorejs/utils/models');
import constants = require('@sdcorejs/utils/constants');
import fns = require('@sdcorejs/utils/fns');
import errors = require('@sdcorejs/utils/errors');

const request: models.PagingReq<{ id: number }> = { pageNumber: 0, pageSize: 20 };
const response: models.PagingRes<{ id: number }> = { items: [{ id: 1 }], total: 1 };
const error: root.SdcoreUtilsError = new errors.UnsafeObjectKeyError('__proto__');
const incognitoOptions: root.DetectIncognitoOptions & fns.DetectIncognitoOptions = { timeoutMs: 100 };
const incognitoResult: root.IncognitoDetectionResult & fns.IncognitoDetectionResult = {
  browserName: 'test',
  isPrivate: false,
};
void [root.DateUtilities, constants.EMPTY_STR, fns.ValidationUtilities, request, response, error, incognitoOptions, incognitoResult];
`,
  );
  await writeJson(join(typeRoot, 'tsconfig.json'), typeScriptConfig());
  runTypeScript(join(typeRoot, 'tsconfig.json'), consumerRoot);
  console.log('[package-validation] .mts and .cts declaration consumers passed');
}

async function validateBrowserBundle(consumerRoot) {
  const browserEntry = join(consumerRoot, 'browser-entry.mjs');
  const browserBundle = join(consumerRoot, 'browser-bundle.mjs');
  await writeFile(
    browserEntry,
    `import * as root from '@sdcorejs/utils';
import * as models from '@sdcorejs/utils/models';
import * as constants from '@sdcorejs/utils/constants';
import * as fns from '@sdcorejs/utils/fns';
import * as errors from '@sdcorejs/utils/errors';

if (typeof root.DateUtilities !== 'object' ||
    typeof models.resolveMaybeAsync !== 'function' ||
    typeof constants.EMPTY_STR !== 'string' ||
    typeof fns.ValidationUtilities !== 'object' ||
    typeof errors.SdcoreUtilsError !== 'function') {
  throw new Error('Browser bundle did not expose the expected package surface');
}
`,
  );

  await build({
    absWorkingDir: consumerRoot,
    bundle: true,
    conditions: ['browser', 'import', 'default'],
    entryPoints: [browserEntry],
    format: 'esm',
    logLevel: 'warning',
    outfile: browserBundle,
    platform: 'browser',
    target: ['es2022'],
  });

  const bundleContent = await readFile(browserBundle, 'utf8');
  assert.equal(/\brxjs\b/.test(bundleContent), false, 'browser bundle contains RxJS');
  assert.equal(/from\s*["']node:/.test(bundleContent), false, 'browser bundle contains a Node builtin import');
  runNode([browserBundle], { cwd: consumerRoot });
  console.log('[package-validation] browser-target bundle and import passed');
}

async function validateExamples(consumerRoot) {
  const examplesRoot = join(consumerRoot, 'documentation-examples');
  await mkdir(examplesRoot);

  const repositoryExamplesRoot = join(repositoryRoot, 'examples');
  if (existsSync(repositoryExamplesRoot)) {
    await cp(repositoryExamplesRoot, join(examplesRoot, 'files'), {
      recursive: true,
    });
  }

  const readme = await readFile(join(repositoryRoot, 'README.md'), 'utf8');
  const blocks = extractTypeScriptBlocks(readme);
  assert.ok(blocks.length > 0, 'README.md must contain TypeScript examples');
  const readmeExamplesRoot = join(examplesRoot, 'readme');
  await mkdir(readmeExamplesRoot);
  await Promise.all(
    blocks.map((block, index) =>
      writeFile(
        join(readmeExamplesRoot, `example-${String(index + 1).padStart(3, '0')}.ts`),
        `export {};\n${block}\n`,
      ),
    ),
  );

  await writeJson(join(examplesRoot, 'tsconfig.json'), {
    ...typeScriptConfig(),
    include: ['**/*.ts', '**/*.mts', '**/*.cts'],
  });
  runTypeScript(join(examplesRoot, 'tsconfig.json'), consumerRoot);
  console.log(
    `[package-validation] ${blocks.length} README block(s) and examples/ compiled against the tarball`,
  );
}

function extractTypeScriptBlocks(markdown) {
  const blocks = [];
  const fence = /^```(?:ts|typescript)(?:[ \t]+[^\r\n]*)?\r?\n([\s\S]*?)^```[ \t]*\r?$/gim;
  let match;
  while ((match = fence.exec(markdown)) !== null) blocks.push(match[1]);
  return blocks;
}

function typeScriptConfig() {
  return {
    compilerOptions: {
      lib: ['ES2022', 'DOM'],
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      noEmit: true,
      skipLibCheck: false,
      strict: true,
      target: 'ES2022',
      types: [],
    },
  };
}

function runTypeScript(projectPath, cwd) {
  const typeScriptCli = join(
    repositoryRoot,
    'node_modules',
    'typescript',
    'bin',
    'tsc',
  );
  runNode([typeScriptCli, '--project', projectPath, '--pretty', 'false'], { cwd });
}

function runNode(arguments_, options) {
  return run(process.execPath, arguments_, options);
}

function runNpm(arguments_, options) {
  const npmExecutable = process.env.npm_execpath;
  if (npmExecutable && isAbsolute(npmExecutable)) {
    return runNode([npmExecutable, ...arguments_], options);
  }
  return run(process.platform === 'win32' ? 'npm.cmd' : 'npm', arguments_, {
    ...options,
    shell: process.platform === 'win32',
  });
}

function run(executable, arguments_, { capture = false, cwd, shell = false } = {}) {
  const result = spawnSync(executable, arguments_, {
    cwd,
    encoding: 'utf8',
    env: process.env,
    shell,
    stdio: capture ? 'pipe' : 'inherit',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `Command failed (${result.status}): ${executable} ${arguments_.join(' ')}${details ? `\n${details}` : ''}`,
    );
  }
  return result.stdout?.trim() ?? '';
}

function resolveExportTarget(packageRoot, target) {
  assert.ok(target.startsWith('./'), `export target must be relative: ${target}`);
  const resolved = resolve(packageRoot, target);
  const relativeTarget = relative(packageRoot, resolved);
  assert.ok(
    relativeTarget && !relativeTarget.startsWith(`..${sep}`) && relativeTarget !== '..',
    `export target escapes package root: ${target}`,
  );
  return resolved;
}

function assertDeprecatedObjectProperties(declaration, property, declarationName) {
  const lines = declaration.split(/\r?\n/u);
  const propertyPattern = new RegExp(`^\\s+${property}:`);
  const matches = lines
    .map((line, index) => propertyPattern.test(line) ? index : -1)
    .filter(index => index >= 0);
  assert.ok(matches.length > 0, `${declarationName} must expose ${property} as an object property`);
  for (const index of matches) {
    let commentStart = index - 1;
    while (commentStart >= 0 && !lines[commentStart].includes('/**')) commentStart--;
    assert.ok(commentStart >= 0, `${declarationName} ${property} is missing TSDoc`);
    const comment = lines.slice(commentStart, index).join('\n');
    assert.match(comment, /@deprecated\b/u, `${declarationName} ${property} must retain @deprecated`);
  }
}

async function listFilesRecursively(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(entryPath));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function removeTemporaryRoot(root) {
  const canonicalRoot = await realpath(root);
  const canonicalParent = dirname(canonicalRoot);
  const [temporaryDirectoryStats, canonicalParentStats] = await Promise.all([
    stat(tmpdir()),
    stat(canonicalParent),
  ]);
  const relativeRoot = relative(canonicalParent, canonicalRoot);
  const safe =
    temporaryDirectoryStats.dev === canonicalParentStats.dev &&
    temporaryDirectoryStats.ino === canonicalParentStats.ino &&
    basename(canonicalRoot).startsWith(temporaryPrefix) &&
    relativeRoot !== '' &&
    relativeRoot !== '..' &&
    !relativeRoot.startsWith(`..${sep}`) &&
    !isAbsolute(relativeRoot);
  if (!safe) {
    throw new Error(`Refusing to remove unsafe temporary path: ${root}`);
  }
  await rm(canonicalRoot, { force: true, recursive: true });
}
