import { JwtContext } from './jwt/types';
import {
  Action,
  ActionByActionCode,
  ActionCode,
  ActionCodeByAction,
} from './registration/types';

export const generateCode = (len: number): string =>
  Math.floor(Math.random() * 10 ** len)
    .toString()
    .padEnd(len, '0');

export const makePhoneMask = (phone: string): string => {
  const endDigits = phone.slice(-4);
  const maskedEndDigits = endDigits.padStart(phone.length - 2, '*');
  const startDigits = phone.slice(0, 2);
  return `${startDigits}${maskedEndDigits}`;
};
export const makeEmailMask = (email: string): string => {
  return email.replace(RegExp(`.{${email.indexOf('@') - 2}}(?=@)`), '***');
};

export const reducePhone = (phone?: string | null): string | null =>
  phone != null ? phone.replace(/\D+/g, '') : null;

export const isAllVerified = (context: JwtContext): boolean =>
  Object.values(context).every((subject) => subject.verified);

export const getCodeByAction = ({ action }: { action: Action }): ActionCode =>
  ActionCode[ActionCodeByAction[action]];
export const getActionByCode = ({ code }: { code: ActionCode }): Action =>
  Action[ActionByActionCode[code]];
