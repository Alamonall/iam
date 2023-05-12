/* eslint-disable import/prefer-default-export */
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshAccessRequest {
  @ApiProperty()
  @IsString()
  refresh_token: string;
}
