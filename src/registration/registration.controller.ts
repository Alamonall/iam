import { Body, Controller, Header, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import RegistrationCompleteAffirmationRequest from './types/RegistrationCompleteAffirmationRequest';
import RegistrationCompleteAffirmationResponse from './types/RegistrationCompleteAffirmationResponse';
import CompleteRegistrationRequest from './types/CompleteRegistrationRequest';
import CompleteRegistrationResponse from './types/CompleteRegistrationResponse';
import RegistrationInitAffirmationRequest from './types/RegistrationInitAffirmationRequest';
import RegistrationInitAffirmationResponse from './types/RegistrationInitAffirmationResponse';
import InitRegistrationResponse from './types/InitRegistrationResponse';
import RegistrationService from './registration.service';
import { RegistrationResendRequest } from './types/RegistrationResendRequest';
import { RegistrationResendResponse } from './types/RegistrationResendResponse';
import RecoveryService from '../recovery/recovery.service';
import { JwtType } from '../jwt/types';
import { JwtMetadata } from '../jwt/jwt.service';
import ForbiddenResponse from '../filters/types/ForbiddenResponse';
import BadRequestResponse from '../filters/types/BadRequestResponse';
import ServerErrorResponse from '../filters/types/ServerErrorResponse';
import { FailureCode } from '../filters/FailureCode';
import UnauthorizedResponse from '../filters/types/UnauthorizedResponse';
import ValidationErrorResponse from '../filters/types/ValidationErrorResponse';

@ApiTags('Registration')
@Controller('registration')
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
  status: 400,
  description: FailureCode.BAD_REQUEST,
  type: BadRequestResponse,
})
@ApiResponse({
  status: 400,
  description: FailureCode.VALIDATION_ERROR,
  type: ValidationErrorResponse,
})
@ApiResponse({
  status: 500,
  description: FailureCode.SERVER_ERROR,
  type: ServerErrorResponse,
})
export default class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly recoveryService: RecoveryService,
  ) {}

  @Post('/init')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: InitRegistrationResponse })
  async init(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
  ): Promise<InitRegistrationResponse> {
    return this.registrationService.init({ realm_name });
  }

  @Post('/affirmation/init')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: RegistrationInitAffirmationResponse })
  async initAffirmation(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
    @Body()
    {
      registration_token,
      action,
      value,
      captcha,
    }: RegistrationInitAffirmationRequest,
  ): Promise<RegistrationInitAffirmationResponse> {
    return this.registrationService.initAffirmation({
      registration_token,
      action,
      value,
      realm_name,
      captcha,
    });
  }

  @Post('/affirmation/complete')
  @HttpCode(200)
  @ApiOkResponse({ type: RegistrationCompleteAffirmationResponse })
  async completeAffirmation(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
    @Body() body: RegistrationCompleteAffirmationRequest,
  ): Promise<RegistrationCompleteAffirmationResponse> {
    return this.registrationService.completeAffirmation({
      ...body,
      realm_name,
    });
  }

  @Post('/complete')
  @HttpCode(200)
  @ApiOkResponse({ type: CompleteRegistrationResponse })
  async complete(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
    @Body() body: CompleteRegistrationRequest,
  ): Promise<CompleteRegistrationResponse> {
    return this.registrationService.complete({ ...body, realm_name });
  }

  @Post('/affirmation/resend')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  @ApiOkResponse({ type: RegistrationResendResponse })
  async resend(
    @Req() { realm_name }: Required<Pick<JwtMetadata, 'realm_name'>>,
    @Body() { token }: RegistrationResendRequest,
  ): Promise<RegistrationResendResponse> {
    return this.recoveryService.resend({
      token,
      realm_name,
      jwt_type: JwtType.REGISTRATION,
    });
  }
}
