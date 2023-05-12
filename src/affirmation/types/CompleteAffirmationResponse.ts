import { ValidateNested } from 'class-validator';
import { JwtContext } from '../../jwt/types';

export default class CompleteAffirmationResponse {
  @ValidateNested()
  context: JwtContext;
}
