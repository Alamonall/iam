import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Action } from '../../registration/types';

export default class AuthenticationCompleteAffirmationResponse {
  @ApiProperty()
  @IsString()
  auth_token: string;

  @ApiProperty({
    isArray: true,
    enum: Action,
  })
  @IsEnum(Action, { each: true })
  required_actions: Array<Action>;
}
