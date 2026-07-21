import {
  ColorUtilities,
  NumberUtilities,
  StringUtilities,
  Utilities,
  ValidationUtilities,
} from '@sdcorejs/utils/fns';

const numeric = NumberUtilities.parseFiniteNumber(' 42.5 ', { trim: true });
const formatted = numeric === null ? '' : NumberUtilities.toVNCurrency(numeric);

const genericUuid = ValidationUtilities.isUuid('550e8400-e29b-11d4-a716-446655440000');
const uuidV4 = ValidationUtilities.isUuidV4('550e8400-e29b-41d4-a716-446655440000');
const relativeUrl = ValidationUtilities.isUrl('/docs/start', { allowRelative: true });
const imageExtensionOnly = ValidationUtilities.hasImageFileExtension('/photo.webp?v=2');
const formattedLabel = StringUtilities.format('Page {0} of {1}', 1, 8);
const genericUuidByPattern = new RegExp(StringUtilities.REGEX_UUID)
  .test('550e8400-e29b-11d4-a716-446655440000');
const normalizedAlias = StringUtilities.changeAliasLowerCase('Điện thoại');
const accent = ColorUtilities.rgbToHex(28, 130, 173);
const accentFromHsl = ColorUtilities.hslToHex(197, 72, 39);
const previewId = Utilities.randomId('preview'); // Convenience only; not security-sensitive.

void [
  formatted,
  genericUuid,
  uuidV4,
  relativeUrl,
  imageExtensionOnly,
  formattedLabel,
  genericUuidByPattern,
  normalizedAlias,
  accent,
  accentFromHsl,
  previewId,
];
