import { ObjectUtilities, StringUtilities, UnsafePropertyPathError } from '@sdcorejs/utils';

interface Settings {
  theme: { mode: 'light' | 'dark'; density: 'comfortable' | 'compact' };
  columns: string[];
}

const defaults: Settings = {
  theme: { mode: 'light', density: 'comfortable' },
  columns: ['name', 'email'],
};
const settings = ObjectUtilities.deepMerge<Settings>(defaults, {
  theme: { ...defaults.theme, density: 'compact' },
});
const independentCopy = ObjectUtilities.clone(settings);
const density = ObjectUtilities.getNestedValue<string>(independentCopy, 'theme.density');
const label = StringUtilities.templateToDisplay(
  'Theme: ${theme.mode}',
  independentCopy,
  { maxDepth: 4, allowAccessors: false },
);

try {
  ObjectUtilities.getNestedValue(independentCopy, 'constructor.prototype');
} catch (error: unknown) {
  if (!(error instanceof UnsafePropertyPathError)) throw error;
}

void [density, label];
