/* eslint-disable import/prefer-default-export */
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsString } from 'class-validator';
import { ActionCode } from '.';

export class RegistrationResendResponse {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({
    isArray: true,
    enum: ActionCode,
  })
  @IsEnum(ActionCode, { each: true })
  required_actions: Array<ActionCode>;

  @ApiProperty()
  @IsDateString()
  resend_date: string;
}
