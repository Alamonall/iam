import { Body, Controller, Header, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtMetadata } from '../jwt/jwt.service';
import { JwtType } from '../jwt/types';
import RecoveryService from './recovery.service';
import RecoveryCompleteAffirmationRequest from './types/RecoveryCompleteAffirmationRequest';
import RecoveryCompleteAffirmationResponse from './types/RecoveryCompleteAffirmationResponse';
import CompleteResetPasswordRequest from './types/CompleteResetPasswordRequest';
import RecoveryInitAffirmationRequest from './types/RecoveryInitAffirmationRequest';
import RecoveryInitAffirmationResponse from './types/RecoveryInitAffirmationResponse';
import PasswordResetResponse from './types/InitResetPasswordResponse';
import { RefreshAccessRequest } from './types/RefreshAccessRequest';
import { RefreshAccessResponse } from './types/RefreshAccessResponse';
import { ResendRequest } from './types/ResendRequest';
import { ResendResponse } from './types/ResendResponse';
import { FailureCode } from '../filters/FailureCode';
import BadRequestResponse from '../filters/types/BadRequestResponse';
import ForbiddenResponse from '../filters/types/ForbiddenResponse';
import ServerErrorResponse from '../filters/types/ServerErrorResponse';
import ValidationErrorResponse from '../filters/types/ValidationErrorResponse';

@ApiTags('Recovery')
@Controller('recovery')
@ApiResponse({ status: 200, description: 'Ok.' })
@ApiResponse({
  status: 403,
  description: FailureCode.FORBIDDEN,
  type: ForbiddenResponse,
})
@ApiResponse({
  status: 500,
  description: FailureCode.SERVER_ERROR,
  type: ServerErrorResponse,
})
@ApiResponse({
  status: 400,
  description: FailureCode.BAD_REQUEST,
  type: BadRequestResponse,
})
@ApiResponse({
  status: 400,
  description: FailureCode.VALIDATION_ERROR,
  type: ValidationErrorResponse,
})
export default class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Post('/password/reset/init')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: PasswordResetResponse })
  async init(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<PasswordResetResponse> {
    return this.recoveryService.init({ realm_name });
  }

  @Post('/password/reset/affirmation/init')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: RecoveryInitAffirmationResponse })
  async initAffirmation(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
    @Body()
    { reset_password_token, action, value }: RecoveryInitAffirmationRequest,
  ): Promise<RecoveryInitAffirmationResponse> {
    return this.recoveryService.initAffirmation({
      realm_name,
      reset_password_token,
      action,
      value,
    });
  }

  @Post('/password/reset/affirmation/complete')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: RecoveryCompleteAffirmationResponse })
  async completeAffirmation(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
    @Body()
    {
      reset_password_token,
      action,
      value,
      secret,
    }: RecoveryCompleteAffirmationRequest,
  ): Promise<RecoveryCompleteAffirmationResponse> {
    return this.recoveryService.completeAffirmation({
      realm_name,
      reset_password_token,
      action,
      value,
      secret,
    });
  }

  @Post('/password/reset/complete')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse()
  async complete(
    @Body() { reset_password_token }: CompleteResetPasswordRequest,
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<void> {
    return this.recoveryService.complete({ realm_name, reset_password_token });
  }

  @Post('/password/reset/affirmation/resend')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: ResendResponse })
  async resend(
    @Body() { token }: ResendRequest,
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<ResendResponse> {
    return this.recoveryService.resend({
      token,
      realm_name,
      jwt_type: JwtType.PASSWORD_RESET,
    });
  }

  @Post('/refresh/access')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: RefreshAccessResponse })
  async refresh(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
    @Body() { refresh_token }: RefreshAccessRequest,
  ): Promise<RefreshAccessResponse> {
    return this.recoveryService.refreshAccess({
      realm_name,
      refresh_token,
    });
  }
}
