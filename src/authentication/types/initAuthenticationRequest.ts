import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { Action } from '../../registration/types';

export default class InitAuthenticationRequest {
  @ApiProperty({ enum: Action })
  @IsEnum(Action, {
    message: 'Invalid action type',
  })
  action: Action;

  @ApiProperty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value.trim().toLowerCase())
  value: string;

  @ApiProperty()
  @IsString()
  secret: string;
}
