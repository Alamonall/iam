import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsString, Matches } from 'class-validator';
import { Action } from '../../registration/types';

export default class RecoveryInitAffirmationRequest {
  @ApiProperty()
  @IsString()
  reset_password_token: string;

  @ApiProperty({ enum: Action })
  @IsEnum(Action, {
    message: 'Invalid action type',
  })
  action: Action;

  @ApiProperty()
  @Matches(/^\+?\d{7,15}$|^[^@\s]+@(?:[^@\s]+\.)+[^@\s]+$/, {
    message: 'Invalid value',
  })
  @Transform(({ value }: TransformFnParams) => value.trim().toLowerCase())
  value: string;
}
