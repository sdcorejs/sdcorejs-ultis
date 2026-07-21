import { VALIDATION_PATTERNS } from '@sdcorejs/utils/constants';
import {
  DateUtilities,
  FilterUtilities,
  NumberUtilities,
  ObjectUtilities,
  StringUtilities,
  ValidationUtilities,
} from '@sdcorejs/utils/fns';
import type {
  Filter,
  FilterDataType,
  FilterFieldType,
  MatchOptions,
  Operator,
  ValidationPatternType,
} from '@sdcorejs/utils/models';
import type { Locale } from '../content/types';
import { renderCodeBlock } from './code-block';
import { renderResultBadge } from './result-badge';

const FILTER_SAMPLE = {
  name: 'iPhone 15',
  sku: '007',
  price: 1_000,
  cost: 700,
  category: 'electronics',
  stock: 0,
  active: true,
  createdAt: '2025-01-15',
  updatedAtMs: Date.parse('2025-01-15T00:00:00Z'),
  vendor: { country: 'VN' },
};

type FilterField = keyof typeof FILTER_SAMPLE | 'vendor.country';

const FILTER_FIELDS: readonly FilterField[] = [
  'name', 'sku', 'price', 'cost', 'category', 'stock', 'active',
  'createdAt', 'updatedAtMs', 'vendor.country',
];

const FILTER_OPERATORS: readonly Operator[] = [
  'EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL',
  'LESS_OR_EQUAL', 'CONTAIN', 'NOT_CONTAIN', 'START_WITH', 'END_WITH',
  'IN', 'NOT_IN', 'BETWEEN', 'NULL', 'NOT_NULL',
];

const VALIDATION_GROUPS: readonly {
  readonly en: string;
  readonly vi: string;
  readonly types: readonly ValidationPatternType[];
}[] = [
  { en: 'Vietnamese', vi: 'Việt Nam', types: ['VN_PHONE', 'VN_ID', 'VN_ID_OR_PASSPORT'] },
  { en: 'Common', vi: 'Thông dụng', types: ['EMAIL', 'PHONE', 'PASSPORT', 'TIME'] },
  { en: 'Web and network', vi: 'Web và mạng', types: ['URL', 'DOMAIN', 'IPV4', 'IPV6', 'IMAGE_URL', 'SLUG'] },
  { en: 'Numeric', vi: 'Số', types: ['NUMBER', 'INTEGER', 'DECIMAL', 'POSITIVE_NUMBER'] },
  { en: 'Identifiers', vi: 'Định danh', types: ['UUID', 'CODE_16', 'CODE_32', 'HEX_COLOR', 'BASE64'] },
];

const LABELS = {
  en: {
    amount: 'Amount',
    data: 'Data',
    dataType: 'Data type',
    dateUnit: 'Numeric date unit',
    direction: 'Direction',
    emptyValidation: 'Enter a value to validate.',
    field: 'Field',
    fieldHint: 'Field type hint',
    filterError: 'Invalid filter',
    filterIntro: 'Build a typed client-side filter and evaluate it against the sample product.',
    filterTitle: 'Filter playground',
    from: 'From',
    imageScope: 'Filename-extension syntax only. Verify remote content independently on a trusted server.',
    input: 'Input',
    match: 'Match',
    noMatch: 'No match',
    noUnit: 'No unit',
    operator: 'Operator',
    pattern: 'Pattern',
    regex: 'Regular expression',
    reset: 'Reset',
    result: 'Result',
    run: 'Run',
    sample: 'Sample product',
    scope: 'These helpers validate syntax and configured policy, not trust or remote content.',
    to: 'To',
    unit: 'Unit',
    useFieldHint: 'Use field type hint',
    validate: 'Validate',
    validationTitle: 'Validation playground',
    value: 'Value',
    valuePlaceholder: 'Enter a value to validate…',
    utilityIntro: 'Try deterministic text, number, date, and safe-object helpers without sending data anywhere.',
    utilityTitle: 'Utility playground',
    alias: 'Normalize Vietnamese text',
    currency: 'Vietnamese currency',
    dateFormat: 'Strict local date',
    merge: 'Safe deep merge',
    invalid: 'Invalid input',
  },
  vi: {
    amount: 'Số lượng',
    data: 'Dữ liệu',
    dataType: 'Kiểu dữ liệu',
    dateUnit: 'Đơn vị thời gian cho số',
    direction: 'Hướng',
    emptyValidation: 'Nhập giá trị cần kiểm tra.',
    field: 'Trường',
    fieldHint: 'Gợi ý kiểu trường',
    filterError: 'Bộ lọc không hợp lệ',
    filterIntro: 'Tạo bộ lọc có kiểu và chạy thử với sản phẩm mẫu.',
    filterTitle: 'Playground bộ lọc',
    from: 'Từ',
    imageScope: 'Chỉ kiểm tra cú pháp phần mở rộng tên tệp. Hãy xác minh nội dung từ xa độc lập trên máy chủ tin cậy.',
    input: 'Đầu vào',
    match: 'Khớp',
    noMatch: 'Không khớp',
    noUnit: 'Không khai báo',
    operator: 'Toán tử',
    pattern: 'Mẫu',
    regex: 'Biểu thức chính quy',
    reset: 'Đặt lại',
    result: 'Kết quả',
    run: 'Chạy',
    sample: 'Sản phẩm mẫu',
    scope: 'Các helper này kiểm tra cú pháp và chính sách đã cấu hình, không xác minh độ tin cậy hoặc nội dung từ xa.',
    to: 'Đến',
    unit: 'Đơn vị',
    useFieldHint: 'Dùng gợi ý kiểu trường',
    validate: 'Kiểm tra',
    validationTitle: 'Playground kiểm tra dữ liệu',
    value: 'Giá trị',
    valuePlaceholder: 'Nhập giá trị cần kiểm tra…',
    utilityIntro: 'Thử các helper văn bản, số, ngày và object an toàn mà không gửi dữ liệu đi đâu.',
    utilityTitle: 'Playground tiện ích',
    alias: 'Chuẩn hóa văn bản tiếng Việt',
    currency: 'Tiền tệ Việt Nam',
    dateFormat: 'Ngày local nghiêm ngặt',
    merge: 'Deep merge an toàn',
    invalid: 'Đầu vào không hợp lệ',
  },
} as const;

function field(labelText: string, control: HTMLElement): HTMLElement {
  const label = document.createElement('label');
  label.className = 'playground-field';
  const text = document.createElement('span');
  text.textContent = labelText;
  label.append(text, control);
  return label;
}

function select<T extends string>(values: readonly T[], initial: T): HTMLSelectElement {
  const control = document.createElement('select');
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    control.append(option);
  }
  control.value = initial;
  return control;
}

function textInput(value: string, placeholder = ''): HTMLInputElement {
  const control = document.createElement('input');
  control.type = 'text';
  control.value = value;
  control.placeholder = placeholder;
  return control;
}

function parseLiteral(raw: string): unknown {
  const value = raw.trim();
  if (!value) return '';
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return raw;
  }
}

function actionButton(label: string, kind: 'primary' | 'secondary' = 'primary'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = kind === 'primary' ? 'button-primary' : 'button-secondary';
  button.textContent = label;
  return button;
}

function liveAnnouncement(): HTMLElement {
  const status = document.createElement('div');
  status.className = 'sr-only playground-announcement';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  return status;
}

export function createValidationPlayground(locale: Locale = 'en'): HTMLElement {
  const labels = LABELS[locale];
  const section = document.createElement('section');
  section.className = 'playground';
  section.setAttribute('aria-labelledby', 'validation-playground-title');
  const title = document.createElement('h2');
  title.id = 'validation-playground-title';
  title.textContent = labels.validationTitle;
  const scope = document.createElement('p');
  scope.className = 'playground-intro';
  scope.textContent = labels.scope;

  const form = document.createElement('form');
  form.className = 'playground-grid';
  const inputPanel = document.createElement('div');
  inputPanel.className = 'playground-panel';
  const inputHeading = document.createElement('h3');
  inputHeading.textContent = labels.input;
  const value = textInput('', labels.valuePlaceholder);
  value.id = 'validation-playground-value';
  const pattern = document.createElement('select');
  pattern.id = 'validation-playground-pattern';
  for (const group of VALIDATION_GROUPS) {
    const optionGroup = document.createElement('optgroup');
    optionGroup.label = group[locale];
    for (const type of group.types) {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type === 'IMAGE_URL'
        ? (locale === 'en' ? 'IMAGE_URL (URL + extension)' : 'IMAGE_URL (URL + phần mở rộng)')
        : type;
      optionGroup.append(option);
    }
    pattern.append(optionGroup);
  }
  const actions = document.createElement('div');
  actions.className = 'playground-actions';
  const validate = actionButton(labels.validate);
  validate.type = 'submit';
  const reset = actionButton(labels.reset, 'secondary');
  reset.type = 'reset';
  actions.append(validate, reset);
  inputPanel.append(inputHeading, field(labels.value, value), field(labels.pattern, pattern), actions);

  const resultPanel = document.createElement('div');
  resultPanel.className = 'playground-panel';
  const resultHeading = document.createElement('h3');
  resultHeading.textContent = labels.result;
  const result = document.createElement('div');
  result.className = 'playground-result';
  const announcement = liveAnnouncement();
  const placeholder = document.createElement('p');
  placeholder.textContent = labels.emptyValidation;
  result.append(placeholder);
  resultPanel.append(resultHeading, result, announcement);
  form.append(inputPanel, resultPanel);
  section.append(title, scope, form);

  function run(): void {
    result.replaceChildren();
    if (!value.value) {
      const message = document.createElement('p');
      message.textContent = labels.emptyValidation;
      result.append(message);
      announcement.textContent = labels.emptyValidation;
      return;
    }
    const type = pattern.value as ValidationPatternType;
    const valid = ValidationUtilities.validate(type, value.value);
    announcement.textContent = valid
      ? (locale === 'en' ? 'Valid' : 'Hợp lệ')
      : (locale === 'en' ? 'Invalid' : 'Không hợp lệ');
    const expression = VALIDATION_PATTERNS.find((candidate) => candidate.type === type)?.pattern ?? '';
    result.append(renderResultBadge(valid, undefined, locale));
    const dl = document.createElement('dl');
    const patternTerm = document.createElement('dt');
    patternTerm.textContent = labels.pattern;
    const patternValue = document.createElement('dd');
    patternValue.textContent = type;
    const regexTerm = document.createElement('dt');
    regexTerm.textContent = labels.regex;
    const regexValue = document.createElement('dd');
    regexValue.textContent = expression;
    dl.append(patternTerm, patternValue, regexTerm, regexValue);
    result.append(dl, renderCodeBlock(
      `ValidationUtilities.validate('${type}', ${JSON.stringify(value.value)})\n// ${valid}`,
      { locale },
    ));
    if (type === 'IMAGE_URL') {
      const note = document.createElement('p');
      note.className = 'callout callout-warning';
      note.textContent = labels.imageScope;
      result.append(note);
    }
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); run(); });
  form.addEventListener('reset', () => {
    queueMicrotask(() => {
      result.replaceChildren();
      const message = document.createElement('p');
      message.textContent = labels.emptyValidation;
      result.append(message);
      announcement.textContent = labels.emptyValidation;
      value.focus();
    });
  });
  pattern.addEventListener('change', () => { if (value.value) run(); });
  return section;
}

export function renderValidationPlayground(
  host: HTMLElement,
  locale: Locale = 'en',
): void {
  host.replaceChildren(createValidationPlayground(locale));
}

export function createFilterPlayground(locale: Locale = 'en'): HTMLElement {
  const labels = LABELS[locale];
  const section = document.createElement('section');
  section.className = 'playground';
  section.setAttribute('aria-labelledby', 'filter-playground-title');
  const title = document.createElement('h2');
  title.id = 'filter-playground-title';
  title.textContent = labels.filterTitle;
  const intro = document.createElement('p');
  intro.className = 'playground-intro';
  intro.textContent = labels.filterIntro;
  const sample = document.createElement('details');
  sample.className = 'sample-data';
  const sampleSummary = document.createElement('summary');
  sampleSummary.textContent = labels.sample;
  sample.append(sampleSummary, renderCodeBlock(JSON.stringify(FILTER_SAMPLE, null, 2), { language: 'JSON', locale }));

  const form = document.createElement('form');
  form.className = 'playground-panel';
  const controls = document.createElement('div');
  controls.className = 'playground-controls';
  const filterField = select(FILTER_FIELDS, 'price');
  const operator = select(FILTER_OPERATORS, 'GREATER_THAN');
  const dataType = select<FilterDataType>(['absolute', 'field', 'date-today', 'date-relative'], 'field');
  const dynamic = document.createElement('div');
  dynamic.className = 'playground-dynamic-controls';

  const fieldHintEnabled = document.createElement('input');
  fieldHintEnabled.type = 'checkbox';
  fieldHintEnabled.id = 'filter-field-hint-enabled';
  fieldHintEnabled.name = 'fieldHintEnabled';
  const fieldHint = select<FilterFieldType>(['string', 'number', 'boolean', 'date'], 'date');
  fieldHint.id = 'filter-field-hint';
  fieldHint.name = 'fieldHint';
  fieldHint.disabled = true;
  const hintRow = document.createElement('div');
  hintRow.className = 'playground-option-row';
  const hintLabel = document.createElement('label');
  hintLabel.className = 'check-field';
  hintLabel.htmlFor = fieldHintEnabled.id;
  hintLabel.append(fieldHintEnabled, document.createTextNode(labels.useFieldHint));
  const hintField = field(labels.fieldHint, fieldHint);
  hintField.classList.add('playground-option-field');
  hintRow.append(hintLabel, hintField);
  const dateUnit = select<'' | 'seconds' | 'milliseconds'>(['', 'seconds', 'milliseconds'], '');
  dateUnit.options[0].textContent = labels.noUnit;

  controls.append(
    field(labels.field, filterField),
    field(labels.operator, operator),
    field(labels.dataType, dataType),
    dynamic,
    hintRow,
    field(labels.dateUnit, dateUnit),
  );
  const actions = document.createElement('div');
  actions.className = 'playground-actions';
  const runButton = actionButton(labels.run);
  runButton.type = 'submit';
  const resetButton = actionButton(labels.reset, 'secondary');
  resetButton.type = 'reset';
  actions.append(runButton, resetButton);
  const output = document.createElement('div');
  output.className = 'playground-result';
  const announcement = liveAnnouncement();
  form.append(controls, actions, output, announcement);
  section.append(title, intro, sample, form);

  function buildDynamicControls(): void {
    dynamic.replaceChildren();
    const selectedOperator = operator.value as Operator;
    const selectedDataType = dataType.value as FilterDataType;
    if (selectedOperator === 'NULL' || selectedOperator === 'NOT_NULL' || selectedDataType === 'date-today') return;
    if (selectedOperator === 'BETWEEN') {
      const from = textInput('500');
      from.dataset.valueRole = 'from';
      const to = textInput('1500');
      to.dataset.valueRole = 'to';
      dynamic.append(field(labels.from, from), field(labels.to, to));
      return;
    }
    if (selectedDataType === 'field') {
      const reference = select(FILTER_FIELDS, 'cost');
      reference.dataset.valueRole = 'field';
      dynamic.append(field(labels.data, reference));
      return;
    }
    if (selectedDataType === 'date-relative') {
      const amount = textInput('7');
      amount.inputMode = 'numeric';
      amount.dataset.valueRole = 'amount';
      const direction = select(['previous', 'next'] as const, 'previous');
      direction.dataset.valueRole = 'direction';
      const unit = select(['hour', 'day', 'week', 'month'] as const, 'day');
      unit.dataset.valueRole = 'unit';
      dynamic.append(field(labels.amount, amount), field(labels.direction, direction), field(labels.unit, unit));
      return;
    }
    const value = textInput('700', locale === 'en' ? 'JSON or text' : 'JSON hoặc văn bản');
    value.dataset.valueRole = 'value';
    dynamic.append(field(labels.data, value));
  }

  function buildFilter(): Filter<typeof FILTER_SAMPLE> {
    const selectedField = filterField.value as FilterField;
    const selectedOperator = operator.value as Operator;
    const selectedDataType = dataType.value as FilterDataType;
    let filterValue: unknown;
    if (selectedOperator === 'NULL' || selectedOperator === 'NOT_NULL') {
      return { field: selectedField, operator: selectedOperator } as Filter<typeof FILTER_SAMPLE>;
    }
    if (selectedOperator === 'BETWEEN') {
      filterValue = {
        from: parseLiteral((dynamic.querySelector('[data-value-role="from"]') as HTMLInputElement)?.value ?? ''),
        to: parseLiteral((dynamic.querySelector('[data-value-role="to"]') as HTMLInputElement)?.value ?? ''),
      };
      return { field: selectedField, operator: 'BETWEEN', data: filterValue } as Filter<typeof FILTER_SAMPLE>;
    }
    if (selectedDataType === 'date-today') filterValue = 'TODAY';
    else if (selectedDataType === 'field') {
      filterValue = (dynamic.querySelector('[data-value-role="field"]') as HTMLSelectElement)?.value ?? 'cost';
    } else if (selectedDataType === 'date-relative') {
      filterValue = {
        amount: Number((dynamic.querySelector('[data-value-role="amount"]') as HTMLInputElement)?.value ?? 0),
        direction: (dynamic.querySelector('[data-value-role="direction"]') as HTMLSelectElement)?.value,
        unit: (dynamic.querySelector('[data-value-role="unit"]') as HTMLSelectElement)?.value,
      };
    } else {
      const raw = (dynamic.querySelector('[data-value-role="value"]') as HTMLInputElement)?.value ?? '';
      filterValue = selectedOperator === 'IN' || selectedOperator === 'NOT_IN'
        ? raw.split(',').map(parseLiteral)
        : parseLiteral(raw);
    }
    return {
      field: selectedField,
      operator: selectedOperator,
      dataType: selectedDataType,
      data: filterValue,
    } as Filter<typeof FILTER_SAMPLE>;
  }

  function run(): void {
    output.replaceChildren();
    const currentFilter = buildFilter();
    const options: MatchOptions<typeof FILTER_SAMPLE> = {};
    if (fieldHintEnabled.checked) {
      options.fieldTypes = { [filterField.value]: fieldHint.value as FilterFieldType } as MatchOptions<typeof FILTER_SAMPLE>['fieldTypes'];
    }
    if (dateUnit.value) {
      options.timestampUnits = { [filterField.value]: dateUnit.value } as MatchOptions<typeof FILTER_SAMPLE>['timestampUnits'];
    }
    try {
      const matches = FilterUtilities.match([currentFilter], FILTER_SAMPLE, options);
      announcement.textContent = matches ? labels.match : labels.noMatch;
      output.append(
        renderResultBadge(matches, matches ? labels.match : labels.noMatch, locale),
        renderCodeBlock(
          `FilterUtilities.match(\n  [${JSON.stringify(currentFilter)}],\n  product,\n  ${JSON.stringify(options)}\n) // ${matches}`,
          { locale },
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : labels.filterError;
      announcement.textContent = labels.filterError;
      output.append(renderResultBadge(false, labels.filterError, locale));
      const detail = document.createElement('p');
      detail.className = 'error-detail';
      detail.textContent = message;
      output.append(detail);
    }
  }

  function rebuild(): void {
    buildDynamicControls();
    run();
  }

  function syncFieldHintState(): void {
    fieldHint.disabled = !fieldHintEnabled.checked;
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); run(); });
  form.addEventListener('input', run);
  form.addEventListener('change', (event) => {
    if (event.target === operator || event.target === dataType) rebuild();
    else run();
  });
  fieldHintEnabled.addEventListener('change', syncFieldHintState);
  form.addEventListener('reset', () => {
    queueMicrotask(() => {
      filterField.value = 'price';
      operator.value = 'GREATER_THAN';
      dataType.value = 'field';
      fieldHintEnabled.checked = false;
      fieldHint.value = 'date';
      syncFieldHintState();
      dateUnit.value = '';
      rebuild();
    });
  });
  rebuild();
  return section;
}

export function renderFilterPlayground(host: HTMLElement, locale: Locale = 'en'): void {
  host.replaceChildren(createFilterPlayground(locale));
}

function utilityPanel(titleText: string): {
  readonly element: HTMLElement;
  readonly controls: HTMLElement;
  readonly output: HTMLOutputElement;
} {
  const element = document.createElement('section');
  element.className = 'utility-demo';
  const title = document.createElement('h3');
  title.textContent = titleText;
  const controls = document.createElement('div');
  controls.className = 'utility-demo-controls';
  const output = document.createElement('output');
  output.className = 'utility-demo-output';
  output.setAttribute('aria-live', 'polite');
  element.append(title, controls, output);
  return { element, controls, output };
}

export function createUtilityPlayground(locale: Locale = 'en'): HTMLElement {
  const labels = LABELS[locale];
  const section = document.createElement('section');
  section.className = 'playground';
  const title = document.createElement('h2');
  title.textContent = labels.utilityTitle;
  const intro = document.createElement('p');
  intro.className = 'playground-intro';
  intro.textContent = labels.utilityIntro;
  const grid = document.createElement('div');
  grid.className = 'utility-demo-grid';

  const aliasDemo = utilityPanel(labels.alias);
  const aliasInput = textInput('Đặng Thái Sơn');
  aliasDemo.controls.append(field(labels.value, aliasInput));
  const updateAlias = (): void => {
    aliasDemo.output.textContent = StringUtilities.changeAliasLowerCase(aliasInput.value);
  };
  aliasInput.addEventListener('input', updateAlias);
  updateAlias();

  const currencyDemo = utilityPanel(labels.currency);
  const currencyInput = textInput('1234567.89');
  currencyInput.inputMode = 'decimal';
  currencyDemo.controls.append(field(labels.value, currencyInput));
  const updateCurrency = (): void => {
    const value = Number(currencyInput.value);
    currencyDemo.output.textContent = Number.isFinite(value)
      ? NumberUtilities.toVNCurrency(value)
      : labels.invalid;
  };
  currencyInput.addEventListener('input', updateCurrency);
  updateCurrency();

  const dateDemo = utilityPanel(labels.dateFormat);
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = '2026-07-20';
  dateDemo.controls.append(field(labels.value, dateInput));
  const updateDate = (): void => {
    try {
      dateDemo.output.textContent = DateUtilities.toFormat(
        DateUtilities.parseLocalDateStrict(dateInput.value),
        'dd/MM/yyyy',
      );
    } catch {
      dateDemo.output.textContent = labels.invalid;
    }
  };
  dateInput.addEventListener('input', updateDate);
  updateDate();

  const mergeDemo = utilityPanel(labels.merge);
  const base = document.createElement('textarea');
  base.rows = 4;
  base.value = '{"theme":{"mode":"light","radius":4}}';
  const override = document.createElement('textarea');
  override.rows = 4;
  override.value = '{"theme":{"radius":8}}';
  mergeDemo.controls.append(field(locale === 'en' ? 'Base JSON' : 'JSON gốc', base));
  mergeDemo.controls.append(field(locale === 'en' ? 'Override JSON' : 'JSON ghi đè', override));
  const updateMerge = (): void => {
    try {
      const baseValue = JSON.parse(base.value) as Record<string, unknown>;
      const overrideValue = JSON.parse(override.value) as Record<string, unknown>;
      mergeDemo.output.textContent = JSON.stringify(ObjectUtilities.deepMerge(baseValue, overrideValue), null, 2);
    } catch {
      mergeDemo.output.textContent = labels.invalid;
    }
  };
  base.addEventListener('input', updateMerge);
  override.addEventListener('input', updateMerge);
  updateMerge();

  grid.append(aliasDemo.element, currencyDemo.element, dateDemo.element, mergeDemo.element);
  section.append(title, intro, grid);
  return section;
}

export function renderUtilityPlayground(host: HTMLElement, locale: Locale = 'en'): void {
  host.replaceChildren(createUtilityPlayground(locale));
}
