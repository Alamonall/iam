/* eslint-disable import/prefer-default-export */
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResendRequest {
  @ApiProperty()
  @IsString()
  token: string;
}
