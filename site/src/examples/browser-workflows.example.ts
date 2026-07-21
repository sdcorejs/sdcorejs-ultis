import { BrowserUtilities } from '@sdcorejs/utils/fns';

export async function chooseDocument(): Promise<File> {
  return BrowserUtilities.upload({
    accept: 'application/pdf',
    extensions: ['pdf'],
    maxSizeInMb: 5,
    fileValidator: file => file.type === 'application/pdf'
      ? undefined
      : 'Expected a PDF file',
  });
}

export function downloadReport(report: Blob): void {
  BrowserUtilities.downloadBlob(report, 'report.pdf');
}

export async function copyReference(reference: string): Promise<void> {
  await BrowserUtilities.copyToClipboard(reference);
}

// Revalidate uploaded bytes on a trusted server. Client checks are UX only.
