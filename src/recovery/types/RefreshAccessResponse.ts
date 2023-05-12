/* eslint-disable import/prefer-default-export */
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class RefreshAccessResponse {
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
