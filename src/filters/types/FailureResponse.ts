import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FailureCode } from '../FailureCode';

export default class FailureResponse {
  @ApiProperty()
  @IsString()
  @IsEnum(FailureCode)
  failure_code: FailureCode;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  failure_message?: string;
}
