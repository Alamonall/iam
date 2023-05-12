/* eslint-disable import/prefer-default-export */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ActionCode } from '../../registration/types';

export class ResendResponse {
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
  resend_date: string;

  @ApiProperty()
  mask: string;
}
