import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsString } from 'class-validator';
import { ActionCode } from '../../registration/types';

export default class RecoveryCompleteAffirmationRequest {
  @ApiProperty()
  @IsString()
  reset_password_token: string;

  @ApiProperty({ enum: ActionCode })
  @IsEnum(ActionCode, {
    message: 'Invalid action code type',
  })
  action: ActionCode;

  @ApiProperty()
  @IsNumberString()
  value: string;

  @ApiProperty()
  @IsString()
  secret: string;
}
