import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class CompleteResetPasswordRequest {
  @ApiProperty()
  @IsString()
  reset_password_token: string;
}
