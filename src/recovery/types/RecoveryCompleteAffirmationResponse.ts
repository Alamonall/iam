import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Action } from '../../registration/types';

export default class RecoveryCompleteAffirmationResponse {
  @ApiProperty()
  @IsString()
  reset_password_token: string;

  @ApiProperty({
    isArray: true,
    enum: Action,
  })
  @IsEnum(Action, { each: true })
  required_actions: Array<Action>;
}
