import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Action } from '../../registration/types';

export default class AuthenticationInitAffirmationRequest {
  @ApiProperty()
  @IsString()
  auth_token: string;

  @ApiProperty({ enum: Action })
  @IsEnum(Action, {
    message: 'Invalid action type',
  })
  action: Action;
}
