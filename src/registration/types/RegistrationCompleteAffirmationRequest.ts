import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsString } from 'class-validator';
import { ActionCode } from '.';

export default class RegistrationCompleteAffirmationRequest {
  @ApiProperty()
  @IsString()
  registration_token: string;

  @ApiProperty({ enum: ActionCode })
  @IsEnum(ActionCode, {
    message: 'Invalid action code type',
  })
  action: ActionCode;

  @ApiProperty()
  @IsNumberString()
  value: string;
}
