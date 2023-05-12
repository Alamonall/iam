import { IsString, ValidateNested } from 'class-validator';
import { JwtContext } from '../../jwt/types';

export default class InitAffirmationResponse {
  @ValidateNested()
  context: JwtContext;

  @IsString()
  mask: string;
}
