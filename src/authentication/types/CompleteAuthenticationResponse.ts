import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export default class CompleteAuthenticationResponse {
  @ApiProperty()
  @IsString()
  access_token: string;

  @ApiProperty()
  @IsString()
  refresh_token: string;

  @ApiProperty()
  @IsDateString()
  expires_at: string;
}
