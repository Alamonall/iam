import { FailureCode } from './FailureCode';

export default class DefaultError extends Error {
  status: number;

  code: FailureCode;

  source?: string;

  additional?: object | string;

  constructor({
    code,
    message,
    source,
    additional,
    status,
  }: {
    code: FailureCode;
    source?: string;
    message?: string;
    additional?: object | string;
    status: number;
  }) {
    super(message ?? 'unknown_error');
    this.code = code;
    this.source = source;
    this.additional = additional;
    this.status = status;
  }
}
