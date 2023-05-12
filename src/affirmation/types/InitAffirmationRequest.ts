import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { JwtContext } from '../../jwt/types';
import { Action } from '../../registration/types';

export default class InitAffirmationRequest {
  @IsString()
  contextId: string;

  @ValidateNested()
  context: JwtContext;

  @IsEnum(Action, {
    message: 'Invalid action type',
  })
  action: Action;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  captcha?: string;

  @IsString()
  type: string;
}
