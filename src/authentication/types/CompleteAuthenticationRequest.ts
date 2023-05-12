import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class CompleteAuthenticationRequest {
  @ApiProperty()
  @IsString()
  auth_token: string;
}
