import newId from "@acme/good-id";
import { Inject, Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { Etcd3 } from "etcd3";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import AffirmationService from "../affirmation/affirmation.service";
import {
  BULL_QUEUES,
  ETCD,
  IAM_USER_REGISTRATION_COMPLETE_EVENT,
} from "../common/constants";
import EventTransporterService from "../event-transporter/event-transporter.service";
import DefaultError from "../filters/DefaultError";
import { FailureCode } from "../filters/FailureCode";
import JwtService, { JwtMetadata } from "../jwt/jwt.service";
import { JwtContext, JwtContextSubject, JwtType } from "../jwt/types";
import KeycloakService, { TokenSet } from "../keycloak/keycloak.service";
import { getActionByCode, getCodeByAction, isAllVerified } from "../utils";
import { Action, ActionCode } from "./types";
import CompleteRegistrationRequest from "./types/CompleteRegistrationRequest";
import CompleteRegistrationResponse from "./types/CompleteRegistrationResponse";
import InitRegistrationResponse from "./types/InitRegistrationResponse";
import RegistrationCompleteAffirmationRequest from "./types/RegistrationCompleteAffirmationRequest";
import RegistrationCompleteAffirmationResponse from "./types/RegistrationCompleteAffirmationResponse";
import RegistrationInitAffirmationRequest from "./types/RegistrationInitAffirmationRequest";
import RegistrationInitAffirmationResponse from "./types/RegistrationInitAffirmationResponse";

@Injectable()
export default class RegistrationService {
  iamProcessName = "registration";

  constructor(
    private readonly jwtService: JwtService,
    @InjectPinoLogger(RegistrationService.name)
    private readonly logger: PinoLogger,
    private readonly affirmationService: AffirmationService,
    private readonly keycloakService: KeycloakService,
    @Inject(EventTransporterService)
    private readonly eventTransporter: EventTransporterService,
    @Inject(BULL_QUEUES) private readonly queues: Record<string, Queue>,
    @Inject(ETCD)
    private readonly etcd: Etcd3
  ) {}

  async init({
    realm_name: realmName,
  }: Required<
    Pick<JwtMetadata, "realm_name">
  >): Promise<InitRegistrationResponse> {
    const contextId: string = newId("ctx");
    const route = "init_registration";
    const context: JwtContext = new Map<Action, JwtContextSubject>();

    const requiredActions = await this.etcd.get(
      `${realmName}/required_actions`
    );

    if (requiredActions == null) {
      throw new DefaultError({
        code: FailureCode.SERVER_ERROR,
        status: 500,
        message: "failed_to_get_required_actions",
        source: route,
        additional: {
          context_id: contextId,
          required_actions: requiredActions,
        },
      });
    }
    const parsedRequiredActions: Array<Action> = JSON.parse(requiredActions);

    this.logger.info({
      msg: "required_actions_etcd",
      route,
      context_id: contextId,
      required_actions: parsedRequiredActions,
    });

    const registrationToken: string = this.jwtService.encode({
      context_id: contextId,
      context,
      required_actions: parsedRequiredActions,
      realm_name: realmName,
      on_verification: null,
      type: JwtType.REGISTRATION,
    });

    return {
      registration_token: registrationToken,
      required_actions: parsedRequiredActions,
    };
  }

  async initAffirmation({
    registration_token,
    action,
    value,
    captcha,
    realm_name: realmName,
  }: RegistrationInitAffirmationRequest &
    Required<
      Pick<JwtMetadata, "realm_name">
    >): Promise<RegistrationInitAffirmationResponse> {
    const route = "registration_init_affirmation";
    this.logger.info({
      msg: "in_init_affirmation",
      route,
      action,
      realm_name: realmName,
      subject_value: value,
    });
    const {
      context_id: contextId,
      context,
      required_actions: requiredActions,
      realm_name: realmNameFromToken,
      on_verification: onVerification,
    }: JwtMetadata = this.jwtService.decode({
      token: registration_token,
      type: JwtType.REGISTRATION,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "invalid_realm",
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
        message: "invalid_action",
        source: route,
        additional: {
          context_id: contextId,
          required_actions: requiredActions,
          action,
        },
      });
    }

    if (onVerification != null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "something_on_verification",
        source: route,
        additional: {
          context_id: contextId,
          on_verification: onVerification,
        },
      });
    }

    context[action] = { subject_value: value };
    this.logger.debug({
      msg: "ctx_updated",
      route,
      context_id: contextId,
      subject_data: context,
    });

    const { context: newContext, mask } = await this.affirmationService.start({
      contextId,
      action,
      value,
      captcha,
      context,
      type: this.iamProcessName,
    });

    const code: ActionCode = getCodeByAction({ action });
    const newRegistrationToken = this.jwtService.encode({
      context_id: contextId,
      context: newContext,
      required_actions: requiredActions,
      on_verification: code,
      realm_name: realmName,
      type: JwtType.REGISTRATION,
    });

    return {
      registration_token: newRegistrationToken,
      required_actions: [code],
      resend_date: newContext[action].resend_date,
      mask,
    };
  }

  async completeAffirmation({
    registration_token,
    action: actionCode,
    value,
    realm_name: realmName,
  }: RegistrationCompleteAffirmationRequest &
    Required<
      Pick<JwtMetadata, "realm_name">
    >): Promise<RegistrationCompleteAffirmationResponse> {
    const route = "reg_complete_affirmation";
    this.logger.debug({
      msg: "init_reg_compl_affirmation",
      route,
      actionCode,
      value,
      realm_name: realmName,
    });
    const action = getActionByCode({ code: actionCode });
    const {
      context_id: contextId,
      context,
      required_actions: requiredActions,
      realm_name: realmNameFromToken,
      on_verification: onVerification,
    }: JwtMetadata = this.jwtService.decode({
      token: registration_token,
      type: JwtType.REGISTRATION,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "invalid_realm",
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
        message: "something_wrong_on_verification",
        source: route,
        additional: {
          context_id: contextId,
          on_verification: onVerification,
          action_code: actionCode,
        },
      });
    }

    const { context: newContext } = await this.affirmationService.complete({
      contextId,
      context,
      action: actionCode,
      value,
      type: this.iamProcessName,
    });

    const newRequiredActions: Array<Action> = requiredActions.filter(
      (requiredAction: Action) => !action.includes(requiredAction)
    );

    this.logger.info({
      msg: "new_required_actions",
      route,
      context_id: contextId,
      new_required_actions: newRequiredActions,
    });

    const newRegistrationToken = this.jwtService.encode({
      context_id: contextId,
      context: newContext,
      required_actions: newRequiredActions,
      on_verification: null,
      realm_name: realmName,
      type: JwtType.REGISTRATION,
    });

    return {
      required_actions: newRequiredActions,
      registration_token: newRegistrationToken,
    };
  }

  async complete({
    registration_token,
    secret,
    realm_name: realmName,
  }: CompleteRegistrationRequest &
    Required<
      Pick<JwtMetadata, "realm_name">
    >): Promise<CompleteRegistrationResponse> {
    const route = "complete_registration";
    const {
      context_id: contextId,
      context,
      realm_name: realmNameFromToken,
      required_actions: requiredActions,
      on_verification: onVerification,
    }: JwtMetadata = this.jwtService.decode({
      token: registration_token,
      type: JwtType.REGISTRATION,
    });

    if (realmName !== realmNameFromToken) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "invalid_realm",
        source: route,
        additional: {
          context_id: contextId,
          request_realm: realmName,
          token_realm: realmNameFromToken,
        },
      });
    }

    if (!isAllVerified(context)) {
      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        status: 403,
        message: "not_all_subject_verified",
        source: route,
        additional: {
          context_id: contextId,
          context,
        },
      });
    }

    if (onVerification != null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "something_wrong_with_on_verification",
        source: route,
        additional: {
          context_id: contextId,
          context,
          on_verification: onVerification,
        },
      });
    }

    if (requiredActions.length !== 0) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "required_actions_array_is_empty",
        source: route,
        additional: {
          context_id: contextId,
          context,
          required_actions: requiredActions,
        },
      });
    }

    this.logger.info({
      msg: "subjects",
      route,
      context_id: contextId,
      email: context[Action.email],
      phone: context[Action.phone],
    });

    const newUsername: string = newId("idty");
    await this.keycloakService.createUser({
      username: newUsername,
      password: secret,
      email: context[Action.email]?.subject_value ?? null,
      phone: context[Action.phone]?.subject_value ?? null,
      realmName,
    });

    this.logger.info({
      msg: "new_user_created",
      username: newUsername,
      realm: realmName,
      route,
      context_id: contextId,
    });

    const tokenSet: TokenSet = await this.keycloakService.authUser({
      username: newUsername,
      password: secret,
      realmName,
    });

    this.logger.info({
      msg: "send_iam_user_registration_complete_event",
      route,
      context_id: contextId,
      user_id: newUsername,
      email: context[Action.email]?.subject_value ?? null,
      phone: context[Action.phone]?.subject_value ?? null,
      realm_name: realmName,
    });

    this.queues[IAM_USER_REGISTRATION_COMPLETE_EVENT].add(
      IAM_USER_REGISTRATION_COMPLETE_EVENT,
      this.eventTransporter.eventWithTracking<
        { context_id: string } & IamUserRegistrationCompleteEvent
      >({
        context_id: contextId ?? newId("ctx"),
        user_id: newUsername,
        email: context[Action.email]?.subject_value ?? null,
        phone: context[Action.phone]?.subject_value ?? null,
        realm_name: realmName,
      })
    );

    const expiresAt = new Date(tokenSet.expiresIn * 1000);

    return {
      access_token: tokenSet.accessToken,
      refresh_token: tokenSet.refreshToken,
      expires_at: expiresAt.toISOString(),
    };
  }
}
