import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(siteRoot, 'dist');
const manifestPath = join(distRoot, '.vite', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const entryKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry === true);

assert.ok(entryKey, 'Vite manifest must contain an entry chunk');

const initialAssets = new Set();
const visitedChunks = new Set();

const collectChunk = (key) => {
  if (visitedChunks.has(key)) return;
  visitedChunks.add(key);
  const chunk = manifest[key];
  assert.ok(chunk, `Manifest import ${key} must resolve to a chunk`);
  if (chunk.file) initialAssets.add(chunk.file);
  for (const cssFile of chunk.css ?? []) initialAssets.add(cssFile);
  for (const importedKey of chunk.imports ?? []) collectChunk(importedKey);
};

collectChunk(entryKey);

const apiDataKey = 'src/content/api-data.ts';
assert.ok(manifest[apiDataKey], 'Vite manifest must contain a lazy API data chunk');
assert.ok(
  !visitedChunks.has(apiDataKey),
  'The bilingual API corpus must not be part of the initial dependency graph',
);
assert.ok(
  (manifest[entryKey].dynamicImports ?? []).includes(apiDataKey),
  'The application entry must expose API data through a dynamic import',
);

let initialGzipBytes = 0;
const measurements = [];
for (const asset of [...initialAssets].sort()) {
  const bytes = await readFile(join(distRoot, asset));
  const gzipBytes = gzipSync(bytes).byteLength;
  initialGzipBytes += gzipBytes;
  measurements.push({ asset, gzipBytes, rawBytes: bytes.byteLength });
}

const budgetBytes = 100 * 1024;
assert.ok(
  initialGzipBytes <= budgetBytes,
  `Initial JavaScript and CSS exceed the 100 KiB gzip budget: ${initialGzipBytes} bytes`,
);

const html = await readFile(join(distRoot, 'index.html'), 'utf8');
assert.match(html, /\/sdcorejs-utils\/assets\//, 'Built assets must use the GitHub Pages base path');
assert.match(html, /<meta charset="UTF-8"\s*\/?>/i, 'Built page must declare UTF-8');

console.log(JSON.stringify({
  budgetBytes,
  initialGzipBytes,
  lazyApiChunk: manifest[apiDataKey].file,
  measurements,
}, null, 2));
