import {
  bulletList,
  callout,
  codeBlock,
  contentTable,
  createPageContent,
  inlineCode,
  localized,
  paragraph,
} from '../render';

export default createPageContent({
  eyebrow: { en: 'Guide', vi: 'Hướng dẫn' },
  title: { en: 'MaybeAsync and RxJS', vi: 'MaybeAsync và RxJS' },
  summary: {
    en: 'Normalize values, promises, and subscribables without making RxJS part of the package runtime contract.',
    vi: 'Chuẩn hóa giá trị, promise và subscribable mà không biến RxJS thành một phần contract runtime của package.',
  },
  sections: [
    {
      anchor: 'structural-contract',
      title: { en: 'The structural contract', vi: 'Contract dạng cấu trúc' },
      render: (context) => [
        paragraph(
          inlineCode('MaybeAsync<T>'),
          localized(context.locale, { en: ' is ', vi: ' là ' }),
          inlineCode('T | PromiseLike<T> | SubscribableLike<T>'),
          localized(context.locale, {
            en: '. SubscribableLike describes compatible subscribe overloads and cleanup values without importing an Observable class.',
            vi: '. SubscribableLike mô tả overload subscribe và cleanup value tương thích mà không import class Observable.',
          }),
        ),
        contentTable(
          localized(context.locale, { en: 'Accepted async shapes', vi: 'Các dạng async được chấp nhận' }),
          localized(context.locale, { en: ['Shape', 'Detection'], vi: ['Dạng', 'Cách nhận biết'] }),
          [
            [[localized(context.locale, { en: 'Plain value', vi: 'Giá trị thường' })], [localized(context.locale, { en: 'Neither then nor subscribe is callable', vi: 'Cả then và subscribe đều không callable' })]],
            [[inlineCode('PromiseLike<T>')], [inlineCode('isPromiseLike')]],
            [[inlineCode('SubscribableLike<T>')], [inlineCode('isSubscribableLike')]],
          ],
        ),
      ],
    },
    {
      anchor: 'resolve-first-value',
      title: { en: 'Resolve the first value', vi: 'Nhận giá trị đầu tiên' },
      render: (context) => [
        paragraph(
          inlineCode('resolveMaybeAsync'),
          localized(context.locale, {
            en: ' resolves a value or promise directly. For a subscribable, it resolves the first emitted value, unsubscribes, rejects source errors, and rejects empty completion with EmptySubscribableError.',
            vi: ' resolve trực tiếp giá trị hoặc promise. Với subscribable, hàm resolve giá trị emit đầu tiên, unsubscribe, reject source error và reject completion rỗng bằng EmptySubscribableError.',
          }),
        ),
        codeBlock(
          `import {
  resolveMaybeAsync,
  type MaybeAsync,
} from '@sdcorejs/utils/models';

async function readName(source: MaybeAsync<string>): Promise<string> {
  return resolveMaybeAsync(source);
}

await readName('Ada');
await readName(Promise.resolve('Grace'));
await readName(existingObservable);`,
          localized(context.locale, { en: 'Resolve one value', vi: 'Resolve một giá trị' }),
        ),
      ],
    },
    {
      anchor: 'normalize-subscription',
      title: { en: 'Normalize subscription', vi: 'Chuẩn hóa subscription' },
      render: (context) => [
        paragraph(
          inlineCode('normalizeSubscribable'),
          localized(context.locale, {
            en: ' returns an existing non-Promise subscribable unchanged. It wraps a plain value or PromiseLike in the dependency-free structural contract.',
            vi: ' trả nguyên một subscribable không phải Promise. Hàm bọc giá trị thường hoặc PromiseLike vào contract dạng cấu trúc không phụ thuộc.',
          }),
        ),
        bulletList([
          [localized(context.locale, { en: 'Plain values emit and complete synchronously.', vi: 'Giá trị thường emit và complete đồng bộ.' })],
          [localized(context.locale, { en: 'Promises emit or report errors when they settle.', vi: 'Promise emit hoặc báo lỗi khi settle.' })],
          [localized(context.locale, { en: 'Unsubscribe prevents later delivery to that structural subscription.', vi: 'Unsubscribe ngăn việc phát tiếp đến structural subscription đó.' })],
          [localized(context.locale, { en: 'Invalid cleanup values from a source subscribe implementation throw ValidationError.', vi: 'Cleanup value không hợp lệ từ source subscribe implementation sẽ throw ValidationError.' })],
        ]),
      ],
    },
    {
      anchor: 'rxjs-boundary',
      title: { en: 'The RxJS boundary', vi: 'Ranh giới RxJS' },
      render: (context) => [
        callout(
          'warning',
          localized(context.locale, { en: 'Structural does not mean full RxJS', vi: 'Tương thích cấu trúc không có nghĩa là đầy đủ RxJS' }),
          paragraph(localized(context.locale, {
            en: 'The normalized return guarantees subscribe, not RxJS-only methods such as pipe. If your consumer requires an Observable, adapt with RxJS in the application boundary.',
            vi: 'Giá trị chuẩn hóa chỉ đảm bảo subscribe, không đảm bảo method riêng của RxJS như pipe. Nếu consumer cần Observable, hãy chuyển đổi bằng RxJS tại biên ứng dụng.',
          })),
        ),
        paragraph(
          inlineCode('normalizeAsync'),
          localized(context.locale, {
            en: ' is a deprecated compatibility alias. Prefer normalizeSubscribable so the dependency-free return contract is explicit.',
            vi: ' là alias tương thích đã deprecated. Ưu tiên normalizeSubscribable để contract return không phụ thuộc được thể hiện rõ.',
          }),
        ),
        codeBlock(
          `import { from } from 'rxjs';
import { normalizeSubscribable } from '@sdcorejs/utils/models';

const structural = normalizeSubscribable(Promise.resolve(42));

// The application owns the RxJS dependency and conversion.
const observable = from(
  new Promise<number>((resolve, reject) => {
    structural.subscribe({ next: resolve, error: reject });
  }),
);`,
          localized(context.locale, { en: 'Adapt at the application boundary', vi: 'Chuyển đổi tại biên ứng dụng' }),
        ),
      ],
    },
  ],
});
