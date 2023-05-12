import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { verify } from "hcaptcha";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import {
  BULL_QUEUES,
  NOTIFICATIONS_SEND_SMS,
  NOTIFICATIONS_SEND_TEMPLATED_EMAIL,
  SERVICE_NAME,
} from "../common/constants";
import EventTransporterService from "../event-transporter/event-transporter.service";
import DefaultError from "../filters/DefaultError";
import { FailureCode } from "../filters/FailureCode";
import getResendDate from "../helpers/getResenDate";
import { JwtContextSubject } from "../jwt/types";
import RedisService from "../redis/redis.service";
import { Action } from "../registration/types";
import {
  generateCode,
  getActionByCode,
  makeEmailMask,
  makePhoneMask,
  reducePhone,
} from "../utils";
import VaultService from "../vault/vault.service";
import CompleteAffirmationRequest from "./types/CompleteAffirmationRequest";
import CompleteAffirmationResponse from "./types/CompleteAffirmationResponse";
import InitAffirmationRequest from "./types/InitAffirmationRequest";
import InitAffirmationResponse from "./types/InitAffirmationResponse";

type AffirmationResponse = {
  affirmationCode: string;
  valueMask: string;
  resendDate: string;
};

type AffirmationSubjectHandler = Record<
  string,
  (
    contextId: string,
    value: string,
    affirmationCodeLength: number,
    captcha?: string,
    type?: string
  ) => Promise<AffirmationResponse>
>;

@Injectable()
export default class AffirmationService {
  affirmationSubjectHandlers: AffirmationSubjectHandler;

  affirmationCodeLength: number;

  affirmationEmailSender: string;

  affirmationEmailFrom: string;

  affirmationEmailSubject: string;

  affirmationCodeTemplateName: string;

  verificationCodeTtl: number;

  resendTimeInSeconds: number;

  affirmationSmsMessage: string;

  tokenExpirationTime: number;

  maxAttemptsToVerify: number;

  hcaptchaSecret: string;

  hcaptchaSiteKey: string;

  constructor(
    @InjectPinoLogger(AffirmationService.name)
    private readonly logger: PinoLogger,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    @Inject(BULL_QUEUES) private readonly queues: Record<string, Queue>,
    @Inject(SERVICE_NAME) private readonly serviceName: string,
    @Inject(EventTransporterService)
    private readonly eventTransporter: EventTransporterService,
    private readonly vaultService: VaultService
  ) {
    this.affirmationSubjectHandlers = {
      [Action.email]: this.affirmationEmail,
      [Action.phone]: this.affirmationPhone,
    };
    this.affirmationCodeLength = this.config.getOrThrow<number>(
      "affirmationCodeLength"
    );
    this.affirmationEmailSender = this.config.getOrThrow<string>(
      "affirmationEmailSender"
    );
    this.affirmationEmailFrom = this.config.getOrThrow<string>(
      "affirmationEmailFrom"
    );
    this.affirmationEmailSubject = this.config.getOrThrow<string>(
      "affirmationEmailSubject"
    );
    this.affirmationCodeTemplateName = this.config.getOrThrow<string>(
      "affirmationCodeTemplateName"
    );
    this.verificationCodeTtl = this.config.getOrThrow<number>(
      "verificationCodeTtl"
    );
    this.resendTimeInSeconds = this.config.getOrThrow<number>(
      "resendTimeInSeconds"
    );
    this.affirmationSmsMessage = this.config.getOrThrow<string>(
      "affirmationSmsMessage"
    );
    this.tokenExpirationTime = this.config.getOrThrow("tokenExpirationTime");
    this.maxAttemptsToVerify = this.config.getOrThrow("maxAttemptsToVerify");
  }

  async init() {
    const route = "affirmation_init";
    const vaultResponse = await this.vaultService.readSecretVersion("hcaptcha");

    if (vaultResponse.status !== "OK") {
      this.logger.error({
        msg: "faield_to_get_data_from_vault_cuz",
        route,
      });
      throw new Error(
        `Cannot get data from vault cuz: ${JSON.stringify(vaultResponse)}`
      );
    }
    this.hcaptchaSiteKey = vaultResponse.data.data.site_key;
    this.hcaptchaSecret = vaultResponse.data.data.secret_key;
  }

  async start({
    contextId,
    action,
    value,
    captcha,
    type,
    context,
  }: InitAffirmationRequest): Promise<InitAffirmationResponse> {
    const route = "affirmation_init";
    this.logger.debug({
      msg: "init_affirmation",
      context_id: contextId,
      route,
      subject_data: context[action],
    });
    const subjectData: JwtContextSubject = context[action];
    const affirmationKey = `init:${type}:${action}:${value}`;
    const isKeyBlocked = await this.redis.exists(affirmationKey);

    if (isKeyBlocked) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "key_is_blocked",
        additional: { context_id: contextId, value, route, action },
      });
    }
    this.redis.set(affirmationKey, "", "EX", this.verificationCodeTtl);

    if (
      subjectData?.verification_code != null &&
      (subjectData?.resend_date == null ||
        new Date(subjectData?.resend_date) < new Date())
    ) {
      throw new DefaultError({
        code: FailureCode.EXPIRED,
        status: 400,
        message: "token_expired",
        source: route,
        additional: {
          context_id: contextId,
          subject_data: subjectData,
          date_now: new Date(),
        },
      });
    }

    if (subjectData?.verified) {
      throw new DefaultError({
        message: "subject_data_verified",
        source: route,
        code: FailureCode.FORBIDDEN,
        status: 403,
        additional: {
          context_id: contextId,
          subject_data: subjectData,
        },
      });
    }

    this.logger.info({
      msg: "affirmations_checks_passed",
      context_id: contextId,
      route,
      action,
    });

    const { affirmationCode, valueMask, resendDate } =
      await this.affirmationSubjectHandlers[action].call(
        this,
        contextId,
        value,
        this.affirmationCodeLength,
        captcha,
        type
      );

    this.logger.info({
      msg: "subject_handleers_call_passed",
      route,
      context_id: contextId,
      verification_code: affirmationCode,
      resend_date: resendDate,
    });
    context[action] = {
      ...context[action],
      verification_code: affirmationCode,
      resend_date: resendDate,
    };

    return {
      context,
      mask: valueMask,
    };
  }

  async complete({
    contextId,
    action: actionCode,
    value,
    type,
    context,
  }: CompleteAffirmationRequest): Promise<CompleteAffirmationResponse> {
    const route = "affirmation_complete";
    this.logger.info({
      msg: "in_affirmation_complete",
      route,
      context_id: contextId,
      action_code: actionCode,
      type,
      code: value,
    });
    const action = getActionByCode({ code: actionCode });
    const subjectData: JwtContextSubject = context[action];
    const affirmationKey = `complete:${type}:${action}:${subjectData.subject_value}`;
    const attemptsData: string | null = await this.redis.get(affirmationKey);
    const currentAttempts: number =
      attemptsData === null ? 1 : parseInt(attemptsData, 10);

    this.logger.info({
      msg: "subject_data",
      route,
      context_id: contextId,
      subject_data: subjectData,
      current_attempts: currentAttempts,
    });
    if (currentAttempts >= this.maxAttemptsToVerify) {
      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        status: 403,
        message: "exceeded_max_attempts_to_verify",
        source: route,
        additional: {
          context_id: contextId,
          current_attempts: currentAttempts,
          max_attempts: this.maxAttemptsToVerify,
        },
      });
    }

    if (subjectData == null) {
      throw new DefaultError({
        status: 500,
        source: route,
        code: FailureCode.SERVER_ERROR,
        additional: {
          context_id: contextId,
          subject_data: subjectData,
        },
      });
    }

    if (subjectData.verification_code == null) {
      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        source: route,
        status: 403,
        message: "verification_code_is_null",
        additional: {
          context_id: contextId,
          verification_code: subjectData.verification_code,
        },
      });
    }

    if (subjectData.verification_code !== value) {
      this.redis.set(
        affirmationKey,
        currentAttempts + 1,
        "EX",
        this.tokenExpirationTime
      );

      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        status: 403,
        message: "verification_code_not_correct",
        source: route,
        additional: {
          context_id: contextId,
          verification_code: subjectData.verification_code,
          send_value: value,
        },
      });
    }

    if (
      subjectData.verification_code != null &&
      (subjectData.resend_date == null ||
        new Date(subjectData.resend_date).getTime() < Date.now())
    ) {
      throw new DefaultError({
        code: FailureCode.EXPIRED,
        status: 400,
        source: route,
        message: "failed_verification",
        additional: {
          context_id: contextId,
          verification_code: subjectData.verification_code,
          resend_date: subjectData.resend_date,
        },
      });
    }

    if (subjectData.verified) {
      throw new DefaultError({
        code: FailureCode.FORBIDDEN,
        status: 403,
        message: "subject_already_verified",
        source: route,
        additional: {
          context_id: contextId,
          subject_dat: subjectData,
        },
      });
    }

    context[action] = {
      ...subjectData,
      verified: subjectData.verification_code === value,
    };

    return {
      context,
    };
  }

  private async affirmationEmail(
    contextId: string,
    value: string,
    affirmationCodeLength: number
  ): Promise<AffirmationResponse> {
    const route = "affirmation_email";
    this.logger.info({
      msg: "affirmation_email",
      context_id: contextId,
      route,
      value,
      affirmation_code_length: affirmationCodeLength,
    });
    const valueMask = makeEmailMask(value);
    const affirmationCode = generateCode(affirmationCodeLength);

    this.queues[NOTIFICATIONS_SEND_TEMPLATED_EMAIL].add(
      NOTIFICATIONS_SEND_TEMPLATED_EMAIL,
      this.eventTransporter.eventWithTracking<
        { context_id: string } & NotificationsTemplatedEmailData
      >({
        context_id: contextId,
        from_address: this.affirmationEmailFrom,
        to_address: value,
        from_sender_name: this.affirmationEmailSender,
        subject: this.affirmationEmailSubject,
        template_name: this.affirmationCodeTemplateName,
        template_language: "EN", // TODO: вытаскивать из keycloak
        template_data: JSON.stringify({ code: affirmationCode }),
      })
    );

    const resendDate = getResendDate(this.resendTimeInSeconds);

    return {
      affirmationCode,
      valueMask,
      resendDate,
    };
  }

  private async affirmationPhone(
    contextId: string,
    value: string,
    affirmationCodeLength: number,
    captcha: string,
    type: string
  ): Promise<AffirmationResponse> {
    const route = "affirmation_phone";
    const cleanPhone = reducePhone(value);
    if (cleanPhone == null) {
      throw new DefaultError({
        code: FailureCode.BAD_REQUEST,
        status: 400,
        message: "phone_is_null",
        source: route,
        additional: {
          context_id: contextId,
          phone: cleanPhone,
        },
      });
    }

    if (type === "registration") {
      const captchaVerdict = await verify(
        this.hcaptchaSecret,
        captcha,
        "",
        this.hcaptchaSiteKey
      );

      this.logger.info({
        msg: "confirmation_phone_ver_v3_hcaptcha_result",
        route,
        catpcha_verdict: captchaVerdict,
        captcha_pass: captchaVerdict.success,
      });

      if (!captchaVerdict.success) {
        throw new DefaultError({
          code: FailureCode.CAPTCHA_FAILED,
          status: 400,
          message: "captcha_failed",
          source: route,
          additional: {
            context_id: contextId,
            captcha_verdict: captchaVerdict,
          },
        });
      }
    }

    const mask = makePhoneMask(cleanPhone);
    const affirmationCode = generateCode(affirmationCodeLength);

    this.queues[NOTIFICATIONS_SEND_SMS].add(
      NOTIFICATIONS_SEND_SMS,
      this.eventTransporter.eventWithTracking<
        { context_id: string } & NotificationsSmsData
      >({
        context_id: contextId,
        from_name: this.serviceName,
        to_phone_number: cleanPhone,
        body: this.affirmationSmsMessage.replace(
          "{{affirmation}}",
          affirmationCode
        ),
      })
    );

    const resendDate = getResendDate(this.resendTimeInSeconds);

    return {
      affirmationCode,
      valueMask: mask,
      resendDate,
    };
  }
}
