import { IsString, ValidateNested } from 'class-validator';
import { JwtContext } from '../../jwt/types';
import { ActionCode } from '../../registration/types';

export default class CompleteAffirmationRequest {
  @IsString()
  contextId: string;

  @IsString()
  action: ActionCode;

  @IsString()
  value: string;

  @IsString()
  type: string;

  @ValidateNested()
  context: JwtContext;
}
