import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Action } from '.';

export default class InitRegistrationResponse {
  @ApiProperty()
  @IsString()
  registration_token: string;

  @ApiProperty({
    isArray: true,
    enum: Action,
  })
  @IsEnum(Action, { each: true })
  required_actions: Array<Action>;
}
