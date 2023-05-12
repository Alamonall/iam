import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsString } from 'class-validator';
import { ActionCode } from '.';

export default class RegistrationInitAffirmationResponse {
  @ApiProperty()
  @IsString()
  registration_token: string;

  @ApiProperty({
    isArray: true,
    enum: ActionCode,
  })
  @IsEnum(ActionCode, { each: true })
  required_actions: Array<ActionCode>;

  @ApiProperty()
  @IsDateString()
  resend_date: string;

  @ApiProperty()
  @IsString()
  mask: string;
}
