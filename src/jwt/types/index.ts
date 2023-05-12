import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { Action } from '../../registration/types';

export enum JwtType {
  REGISTRATION = 'REGISTRATION',
  AFFIRMATION = 'AFFIRMATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export class JwtContextSubject {
  @IsBoolean()
  verified: boolean;

  @IsString()
  @IsOptional()
  subject_value: string | null;

  @IsString()
  @IsOptional()
  verification_code: string | null;

  @IsDateString()
  @IsOptional()
  resend_date: string;

  @IsString()
  @IsOptional()
  secret: string;
}

export type JwtContext = Map<Action, JwtContextSubject>;
