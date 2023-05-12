import newId from '@acme/good-id';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import AffirmationService from '../affirmation/affirmation.service';
import { getActionByCode, getCodeByAction, isAllVerified } from '../utils';
import { FailureCode } from '../filters/FailureCode';
import JwtService, { JwtMetadata } from '../jwt/jwt.service';
import { JwtContext, JwtContextSubject, JwtType } from '../jwt/types';
import KeycloakService, { TokenSet } from '../keycloak/keycloak.service';
import AuthenticationCompleteAffirmationRequest from './types/AuthenticationCompleteAffirmationRequest';
import AuthenticationCompleteAffirmationResponse from './types/AuthenticationCompleteAffirmationResponse';
import CompleteAuthenticationRequest from './types/CompleteAuthenticationRequest';
import CompleteAuthenticationResponse from './types/CompleteAuthenticationResponse';
import AuthenticationInitAffirmationRequest from './types/AuthenticationInitAffirmationRequest';
import AuthenticationInitAffirmationResponse from './types/AuthenticationInitAffirmationResponse';
import InitAuthenticationRequest from './types/initAuthenticationRequest';
import InitAuthenticationResponse from './types/initAuthenticationResponse';
import { Action } from '../registration/types';
import DefaultError from '../filters/DefaultError';

@Injectable()
export default class AuthenticationService {
  iamProcessName = 'authentication';

  constructor(
    private readonly jwtService: JwtService,
    @InjectPinoLogger(AuthenticationService.name)
    private readonly logger: PinoLogger,
    private readonly affirmationService: AffirmationService,
    private readonly keycloakService: KeycloakService,
  ) {}

  async init({
    action,
    value,
    secret,
    realm_name: realmName,
  }: InitAuthenticationRequest &
    Required<
      Pick<JwtMetadata, 'realm_name'>
    >): Promise<InitAuthenticationResponse> {
    const contextId: string = newId('ctx');
    const route = 'auth_init';
    this.logger.info({
      msg: 'init_auth',
      route,
      action,
      realm_name: realmName,
      subject_value: value,
      context_id: contextId,
    });
    const context: JwtContext = new Map<Action, JwtContextSubject>();

    context[action] = {
      verified: false,
      subject_value: value,
      secret,
      verification_code: null,
      resend_date: null,
    };

    const authToken: string = this.jwtService.encode({
      context_id: contextId,
      context,
      required_actions: [action],
      on_verification: null,
      realm_name: realmName,
      type: JwtType.AUTHENTICATION,
    });

    return {
      auth_token: authToken,
      required_actions: [action],
    };
  }

  async initAffirmation({
    auth_token: authToken,
    action,
    realm_name: realmName,
  }: AuthenticationInitAffirmationRequest &
    Required<
      Pick<JwtMetadata, 'realm_name'>
    >): Promise<AuthenticationInitAffirmationResponse> {
    const route = 'auth_init_affirmation';
    this.logger.info({
      msg: 'in_auth_init_affirmation',
      route,
      action,
      realm_name: realmName,
    });
    const {
      context_id: contextId,
      context,
      required_actions: requiredActions,
      realm_name: realmNameFromToken,
      on_verification: onVerification,
    }: JwtMetadata = this.jwtService.decode({
      token: authToken,
      type: JwtType.AUTHENTICATION,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          context_id: contextId,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (requiredActions.indexOf(action) === -1) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_action',
        source: route,
        additional: {
          context_id: contextId,
          required_actions: requiredActions,
          action,
        },
      });
    }

    const actionCode = getCodeByAction({ action });
    if (onVerification != null && onVerification !== actionCode) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'nothing_on_verification',
        source: route,
        additional: {
          context_id: contextId,
          required_actions: requiredActions,
          action,
        },
      });
    }

    const { context: newContext, mask } = await this.affirmationService.start({
      contextId,
      action,
      value: context[action].subject_value,
      context,
      type: this.iamProcessName,
    });

    const newAuthToken = this.jwtService.encode({
      context_id: contextId,
      context: newContext,
      required_actions: requiredActions,
      on_verification: actionCode,
      realm_name: realmName,
      type: JwtType.AUTHENTICATION,
    });

    return {
      auth_token: newAuthToken,
      required_actions: [actionCode],
      resend_date: context[action].resend_date,
      mask,
    };
  }

  async completeAffiramtion({
    auth_token: authToken,
    action: actionCode,
    value,
    realm_name: realmName,
  }: AuthenticationCompleteAffirmationRequest &
    Required<
      Pick<JwtMetadata, 'realm_name'>
    >): Promise<AuthenticationCompleteAffirmationResponse> {
    const route = 'auth_complete_affirmation';
    this.logger.info({
      msg: 'auth_complete_affirmation_init',
      route,
      action_code: actionCode,
      realm_name: realmName,
      code: value,
    });
    const {
      context_id: contextId,
      context,
      required_actions: requiredActions,
      on_verification: onVerification,
      realm_name: realmNameFromToken,
    }: JwtMetadata = this.jwtService.decode({
      token: authToken,
      type: JwtType.AUTHENTICATION,
    });

    this.logger.info({
      msg: 'decoded_token',
      route,
      context_id: contextId,
      context,
      on_verification: onVerification,
      realm_name_from_token: realmNameFromToken,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          context_id: contextId,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (onVerification == null || onVerification !== actionCode) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'something_with_on_verification',
        source: route,
        additional: {
          on_verification: onVerification,
          context_id: contextId,
          action_code: actionCode,
        },
      });
    }

    this.logger.info({
      msg: 'all_checks_complete',
      route,
      ctx: contextId,
      action_code: actionCode,
    });
    const { context: newContext } = await this.affirmationService.complete({
      contextId,
      context,
      action: actionCode,
      value,
      type: this.iamProcessName,
    });

    this.logger.info({
      msg: 'generated_new_context',
      route,
      context_id: contextId,
    });

    const action = getActionByCode({ code: actionCode });
    const newRequiredActions = requiredActions.filter(
      (requiredAction) => requiredAction !== action,
    );

    const newAuthToken = this.jwtService.encode({
      context_id: contextId,
      context: newContext,
      required_actions: newRequiredActions,
      on_verification: null,
      realm_name: realmName,
      type: JwtType.AUTHENTICATION,
    });

    return {
      auth_token: newAuthToken,
      required_actions: newRequiredActions,
    };
  }

  async complete({
    auth_token: authToken,
    realm_name: realmName,
  }: CompleteAuthenticationRequest &
    Required<
      Pick<JwtMetadata, 'realm_name'>
    >): Promise<CompleteAuthenticationResponse> {
    const route = 'auth_complete';
    this.logger.info({
      msg: 'in_auth_complete',
      route,
      realm_name: realmName,
    });
    const {
      context,
      context_id: contextId,
      realm_name: realmNameFromToken,
      on_verification: onVerification,
      required_actions: requiredActions,
    }: JwtMetadata = this.jwtService.decode({
      token: authToken,
      type: JwtType.AUTHENTICATION,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_realm',
        source: route,
        additional: {
          context_id: contextId,
          req_realm_name: realmName,
          token_realm_name: realmNameFromToken,
        },
      });
    }

    if (!isAllVerified(context)) {
      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        status: 403,
        message: 'not_all_subjects_verified',
        source: route,
        additional: {
          context_id: contextId,
          context,
          req_realm_name: realmName,
          token_realm_name: realmNameFromToken,
        },
      });
    }

    if (onVerification != null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'subject_on_verification',
        source: route,
        additional: {
          context_id: contextId,
          on_verification: onVerification,
        },
      });
    }

    if (requiredActions.length !== 0) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'not_all_actions_verified',
        source: route,
        additional: {
          context_id: contextId,
          required_actions: requiredActions,
        },
      });
    }

    const subject = Object.entries(context)[0];

    if (subject == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_ctx',
        source: route,
        additional: {
          context_id: contextId,
          subject,
        },
      });
    }

    if (
      subject[0] == null ||
      subject[1].subject_value == null ||
      subject[1].secret == null
    ) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: 'invalid_subject_data',
        source: route,
        additional: {
          context_id: contextId,
          subject_name: subject[0],
          subject_dat: subject[1],
        },
      });
    }

    const users = await this.keycloakService.getUsersByParams({
      searchBy: subject[0],
      value: subject[1].subject_value,
      realmName,
    });

    if (users[0] == null) {
      throw new DefaultError({
        code: FailureCode.UNAUTHORIZED,
        status: 401,
        message: 'user_not_found',
        source: route,
        additional: {
          context_id: contextId,
          searchBy: subject[0],
          value: subject[1].subject_value,
          realm_name: realmName,
          users,
        },
      });
    }

    const tokenSet: TokenSet = await this.keycloakService.authUser({
      username: users[0].username,
      password: subject[1].secret,
      realmName,
    });

    const expiresAt = new Date(tokenSet.expiresIn * 1000);

    return {
      access_token: tokenSet.accessToken,
      refresh_token: tokenSet.refreshToken,
      expires_at: expiresAt.toISOString(),
    };
  }
}
