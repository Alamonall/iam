import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { FailureCode } from '../FailureCode';
import FailureResponse from './FailureResponse';

export default class UnauthorizedResponse extends FailureResponse {
  @ApiProperty({ enum: FailureCode })
  @IsString()
  declare failure_code: FailureCode.UNAUTHORIZED;
}
