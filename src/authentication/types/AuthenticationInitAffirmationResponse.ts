import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ActionCode } from '../../registration/types';

export default class AuthenticationInitAffirmationResponse {
  @ApiProperty()
  @IsString()
  auth_token: string;

  @ApiProperty({
    isArray: true,
    enum: ActionCode,
  })
  @IsEnum(ActionCode, { each: true })
  required_actions: Array<ActionCode>;

  @ApiProperty()
  resend_date: string;

  @ApiProperty()
  @IsString()
  mask: string;
}
