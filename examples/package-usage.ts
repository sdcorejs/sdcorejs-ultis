import {
  DateUtilities,
  SdcoreUtilsError,
  type PagingReq,
} from '@sdcorejs/utils';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { UnsafeObjectKeyError } from '@sdcorejs/utils/errors';
import { ValidationUtilities } from '@sdcorejs/utils/fns';
import type { PagingRes } from '@sdcorejs/utils/models';

interface User {
  id: number;
  email: string;
}

const request: PagingReq<User> = {
  pageNumber: 0,
  pageSize: 20,
};
const response: PagingRes<User> = {
  items: [{ id: 1, email: 'user@example.com' }],
  total: 1,
};
const error: SdcoreUtilsError = new UnsafeObjectKeyError('__proto__');

void [
  DateUtilities,
  EMPTY_STR,
  ValidationUtilities.isEmail(response.items[0]?.email),
  request,
  error,
];
