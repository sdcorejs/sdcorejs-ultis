import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(SITE_DIR, '..');

const ROOT_ENTRY_POINTS = Object.freeze({
  '@sdcorejs/utils/constants': path.join(REPO_DIR, 'src/constants/index.ts'),
  '@sdcorejs/utils/errors': path.join(REPO_DIR, 'src/errors.ts'),
  '@sdcorejs/utils/fns': path.join(REPO_DIR, 'src/fns/index.ts'),
  '@sdcorejs/utils/models': path.join(REPO_DIR, 'src/models/index.ts'),
});

function loadProgram(configPath) {
  const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
  if (loaded.error) {
    throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, '\n'));
  }

  const parsed = ts.parseJsonConfigFileContent(
    loaded.config,
    ts.sys,
    path.dirname(configPath),
    undefined,
    configPath,
  );
  if (parsed.errors.length > 0) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
      getCanonicalFileName: value => value,
      getCurrentDirectory: () => REPO_DIR,
      getNewLine: () => '\n',
    }));
  }

  return ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
}

function requiredSourceFile(program, filename) {
  const source = program.getSourceFile(filename);
  if (!source) throw new Error(`TypeScript program does not contain ${path.relative(REPO_DIR, filename)}.`);
  return source;
}

function exportedSymbols(program, filename) {
  const checker = program.getTypeChecker();
  const source = requiredSourceFile(program, filename);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`Cannot resolve module exports for ${path.relative(REPO_DIR, filename)}.`);
  return checker.getExportsOfModule(moduleSymbol);
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en'));
}

function compareExact(label, actualValues, expectedValues, failures) {
  const actual = sortedUnique(actualValues);
  const expected = sortedUnique(expectedValues);
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter(value => !actualSet.has(value));
  const extra = actual.filter(value => !expectedSet.has(value));

  if (actualValues.length !== actual.length) {
    failures.push(`${label} contains duplicate values.`);
  }
  if (missing.length > 0) failures.push(`${label} is missing: ${missing.join(', ')}`);
  if (extra.length > 0) failures.push(`${label} has unexpected values: ${extra.join(', ')}`);
}

function resolveExport(checker, symbols, name) {
  const symbol = symbols.find(candidate => candidate.getName() === name);
  if (!symbol) throw new Error(`Missing required documentation export ${name}.`);
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function literalStringType(type, label) {
  if (!(type.flags & ts.TypeFlags.StringLiteral)) {
    throw new Error(`${label} must retain a literal string type (use "as const").`);
  }
  return type.value;
}

function literalTupleType(checker, type, label) {
  const numericProperties = type.getProperties()
    .filter(property => /^\d+$/.test(property.getName()))
    .sort((left, right) => Number(left.getName()) - Number(right.getName()));

  if (numericProperties.length === 0) {
    const length = type.getProperty('length');
    const lengthDeclaration = length?.valueDeclaration ?? length?.declarations?.[0];
    const lengthType = length && lengthDeclaration
      ? checker.getTypeOfSymbolAtLocation(length, lengthDeclaration)
      : undefined;
    if (!lengthType || !(lengthType.flags & ts.TypeFlags.NumberLiteral) || lengthType.value !== 0) {
      throw new Error(`${label} must be a literal readonly tuple.`);
    }
  }

  return numericProperties.map((property) => {
    const propertyType = checker.getTypeOfPropertyOfType(type, property.getName());
    if (!propertyType) throw new Error(`Cannot inspect ${label}.${property.getName()}.`);
    return literalStringType(propertyType, `${label}.${property.getName()}`);
  });
}

function literalTuple(checker, symbol, label) {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) throw new Error(`Cannot inspect ${label}.`);
  return literalTupleType(checker, checker.getTypeOfSymbolAtLocation(symbol, declaration), label);
}

function literalTupleMap(checker, symbol, label) {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) throw new Error(`Cannot inspect ${label}.`);
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  return new Map(type.getProperties().map((property) => {
    const propertyType = checker.getTypeOfPropertyOfType(type, property.getName());
    if (!propertyType) throw new Error(`Cannot inspect ${label}.${property.getName()}.`);
    return [
      property.getName(),
      literalTupleType(checker, propertyType, `${label}.${property.getName()}`),
    ];
  }));
}

function literalStringMap(checker, symbol, label) {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) throw new Error(`Cannot inspect ${label}.`);
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  return new Map(type.getProperties().map((property) => {
    const propertyType = checker.getTypeOfPropertyOfType(type, property.getName());
    if (!propertyType) throw new Error(`Cannot inspect ${label}.${property.getName()}.`);
    return [property.getName(), literalStringType(propertyType, `${label}.${property.getName()}`)];
  }));
}

function symbolType(checker, symbol) {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declaration = resolved.valueDeclaration ?? resolved.declarations?.[0];
  return declaration ? checker.getTypeOfSymbolAtLocation(resolved, declaration) : undefined;
}

function declaredSymbolType(checker, symbol) {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return checker.getDeclaredTypeOfSymbol(resolved);
}

function main() {
  const failures = [];
  const rootProgram = loadProgram(path.join(REPO_DIR, 'tsconfig.json'));
  const rootChecker = rootProgram.getTypeChecker();
  const rootSymbols = exportedSymbols(rootProgram, path.join(REPO_DIR, 'src/index.ts'));
  const rootNames = rootSymbols.map(symbol => symbol.getName());

  const canonicalImportPaths = new Map();
  for (const [importPath, filename] of Object.entries(ROOT_ENTRY_POINTS)) {
    for (const symbol of exportedSymbols(rootProgram, filename)) {
      const name = symbol.getName();
      const previous = canonicalImportPaths.get(name);
      if (previous && previous !== importPath) {
        failures.push(`Public symbol ${name} appears in multiple canonical subpaths: ${previous}, ${importPath}.`);
      }
      canonicalImportPaths.set(name, importPath);
    }
  }

  compareExact('Canonical subpath exports', [...canonicalImportPaths.keys()], rootNames, failures);

  const expectedMembers = new Map();
  for (const symbol of rootSymbols) {
    if (!symbol.getName().endsWith('Utilities')) continue;
    const type = symbolType(rootChecker, symbol);
    if (!type) continue;
    expectedMembers.set(symbol.getName(), type.getProperties().map(property => property.getName()));
  }

  const siteProgram = loadProgram(path.join(SITE_DIR, 'tsconfig.json'));
  const siteChecker = siteProgram.getTypeChecker();
  const apiFile = path.join(SITE_DIR, 'src/content/api-data.ts');
  const apiSymbols = exportedSymbols(siteProgram, apiFile);
  const documentedSymbols = literalTuple(
    siteChecker,
    resolveExport(siteChecker, apiSymbols, 'DOCUMENTED_PUBLIC_SYMBOLS'),
    'DOCUMENTED_PUBLIC_SYMBOLS',
  );
  const documentedMembers = literalTupleMap(
    siteChecker,
    resolveExport(siteChecker, apiSymbols, 'DOCUMENTED_NAMESPACE_MEMBERS'),
    'DOCUMENTED_NAMESPACE_MEMBERS',
  );
  const documentedImports = literalStringMap(
    siteChecker,
    resolveExport(siteChecker, apiSymbols, 'DOCUMENTED_IMPORT_PATHS'),
    'DOCUMENTED_IMPORT_PATHS',
  );
  const documentedStructuredProperties = literalTupleMap(
    siteChecker,
    resolveExport(siteChecker, apiSymbols, 'DOCUMENTED_STRUCTURED_PROPERTIES'),
    'DOCUMENTED_STRUCTURED_PROPERTIES',
  );
  const documentedDeprecatedTypes = literalTuple(
    siteChecker,
    resolveExport(siteChecker, apiSymbols, 'DOCUMENTED_DEPRECATED_TYPES'),
    'DOCUMENTED_DEPRECATED_TYPES',
  );

  compareExact('DOCUMENTED_PUBLIC_SYMBOLS', documentedSymbols, rootNames, failures);
  compareExact('DOCUMENTED_IMPORT_PATHS keys', [...documentedImports.keys()], rootNames, failures);
  compareExact('DOCUMENTED_NAMESPACE_MEMBERS keys', [...documentedMembers.keys()], [...expectedMembers.keys()], failures);

  for (const [symbolName, documentedProperties] of documentedStructuredProperties) {
    const rootSymbol = rootSymbols.find(symbol => symbol.getName() === symbolName);
    const type = rootSymbol ? declaredSymbolType(rootChecker, rootSymbol) : undefined;
    if (!type) {
      failures.push(`DOCUMENTED_STRUCTURED_PROPERTIES references unknown or uninspectable symbol ${symbolName}.`);
      continue;
    }
    const compilerProperties = type.getProperties().map(property =>
      `${property.getName()}${property.flags & ts.SymbolFlags.Optional ? '?' : ''}`);
    compareExact(
      `DOCUMENTED_STRUCTURED_PROPERTIES.${symbolName}`,
      documentedProperties,
      compilerProperties,
      failures,
    );
  }

  for (const symbolName of documentedDeprecatedTypes) {
    const rootSymbol = rootSymbols.find(symbol => symbol.getName() === symbolName);
    const resolved = rootSymbol && rootSymbol.flags & ts.SymbolFlags.Alias
      ? rootChecker.getAliasedSymbol(rootSymbol)
      : rootSymbol;
    const hasDeprecatedTag = resolved?.declarations?.some(declaration =>
      ts.getJSDocDeprecatedTag(declaration) !== undefined) ?? false;
    if (!hasDeprecatedTag) {
      failures.push(`${symbolName} is documented as deprecated but has no @deprecated declaration tag.`);
    }
  }

  for (const name of rootNames) {
    const expectedImportPath = canonicalImportPaths.get(name);
    const actualImportPath = documentedImports.get(name);
    if (actualImportPath !== expectedImportPath) {
      failures.push(`${name} uses ${String(actualImportPath)}; expected ${String(expectedImportPath)}.`);
    }
  }

  for (const [namespace, members] of expectedMembers) {
    compareExact(
      `DOCUMENTED_NAMESPACE_MEMBERS.${namespace}`,
      documentedMembers.get(namespace) ?? [],
      members,
      failures,
    );
  }

  if (documentedSymbols.length !== rootNames.length) {
    failures.push(`Documented symbol count is ${documentedSymbols.length}; expected ${rootNames.length}.`);
  }
  const expectedMemberCount = [...expectedMembers.values()].reduce((total, members) => total + members.length, 0);
  const documentedMemberCount = [...documentedMembers.values()].reduce((total, members) => total + members.length, 0);
  if (documentedMemberCount !== expectedMemberCount) {
    failures.push(`Documented namespace-member count is ${documentedMemberCount}; expected ${expectedMemberCount}.`);
  }

  if (failures.length > 0) {
    console.error(`Documentation content validation failed (${failures.length}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Documentation content validation passed: ${rootNames.length} public symbols, `
      + `${expectedMemberCount} namespace members, ${documentedStructuredProperties.size} structured types, `
      + `${documentedDeprecatedTypes.length} deprecated types, and canonical subpath imports are covered.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
