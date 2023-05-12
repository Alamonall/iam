import { Controller, Post, Body, HttpCode, Header, Req } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtType } from '../jwt/types';
import RecoveryService from '../recovery/recovery.service';
import { ResendRequest } from '../recovery/types/ResendRequest';
import { ResendResponse } from '../recovery/types/ResendResponse';
import AuthenticationService from './authentication.service';
import AuthenticationCompleteAffirmationRequest from './types/AuthenticationCompleteAffirmationRequest';
import AuthenticationCompleteAffirmationResponse from './types/AuthenticationCompleteAffirmationResponse';
import CompleteAuthenticationRequest from './types/CompleteAuthenticationRequest';
import CompleteAuthenticationResponse from './types/CompleteAuthenticationResponse';
import AuthenticationInitAffirmationRequest from './types/AuthenticationInitAffirmationRequest';
import AuthenticationInitAffirmationResponse from './types/AuthenticationInitAffirmationResponse';
import InitAuthenticationRequest from './types/initAuthenticationRequest';
import InitAuthenticationResponse from './types/initAuthenticationResponse';
import { JwtMetadata } from '../jwt/jwt.service';
import ForbiddenResponse from '../filters/types/ForbiddenResponse';
import ServerErrorResponse from '../filters/types/ServerErrorResponse';
import BadRequestResponse from '../filters/types/BadRequestResponse';
import { FailureCode } from '../filters/FailureCode';
import UnauthorizedResponse from '../filters/types/UnauthorizedResponse';
import CaptchaFailedResponse from '../filters/types/CaptchaFailedResponse';
import ValidationErrorResponse from '../filters/types/ValidationErrorResponse';

@ApiTags('Authentication')
@Controller('authentication')
@ApiResponse({ status: 200, description: 'Ok.' })
@ApiResponse({
  status: 401,
  description: FailureCode.UNAUTHORIZED,
  type: UnauthorizedResponse,
})
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
  description: FailureCode.CAPTCHA_FAILED,
  type: CaptchaFailedResponse,
})
@ApiResponse({
  status: 400,
  description: FailureCode.VALIDATION_ERROR,
  type: ValidationErrorResponse,
})
export default class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly recoveryService: RecoveryService,
  ) {}

  @Post('/init')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: InitAuthenticationResponse })
  initAuthentication(
    @Body() body: InitAuthenticationRequest,
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<InitAuthenticationResponse> {
    return this.authenticationService.init({ ...body, realm_name });
  }

  @Post('/affirmation/init')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: AuthenticationInitAffirmationResponse })
  initAffirmation(
    @Body() body: AuthenticationInitAffirmationRequest,
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<AuthenticationInitAffirmationResponse> {
    return this.authenticationService.initAffirmation({
      ...body,
      realm_name,
    });
  }

  @Post('/affirmation/complete')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: AuthenticationCompleteAffirmationResponse })
  confirmAffirmation(
    @Body() body: AuthenticationCompleteAffirmationRequest,
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<AuthenticationCompleteAffirmationResponse> {
    return this.authenticationService.completeAffiramtion({
      ...body,
      realm_name,
    });
  }

  @Post('/complete')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: CompleteAuthenticationResponse })
  async confirmAuthentication(
    @Body() body: CompleteAuthenticationRequest,
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<CompleteAuthenticationResponse> {
    return this.authenticationService.complete({
      ...body,
      realm_name,
    });
  }

  @Post('/affirmation/resend')
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
      jwt_type: JwtType.AUTHENTICATION,
    });
  }
}
