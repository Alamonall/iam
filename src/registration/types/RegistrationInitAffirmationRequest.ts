import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { Action } from '.';

export default class RegistrationInitAffirmationRequest {
  @ApiProperty()
  @IsString()
  registration_token: string;

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
  @IsString()
  value: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  captcha?: string;
}
