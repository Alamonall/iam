import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class CompleteRegistrationRequest {
  @ApiProperty()
  @IsString()
  registration_token: string;

  @ApiProperty()
  @IsString()
  secret: string;
}
