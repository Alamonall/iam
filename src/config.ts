import * as env from "env-var";

export default () => ({
  environment: env
    .get("ENVIRONMENT")
    .default("local")
    .required()
    .asEnum(["local", "test", "stage", "production"]),
  logLevel: env
    .get("LOG_LEVEL")
    .default("debug")
    .asEnum(["fatal", "error", "warn", "info", "debug", "trace"]),
  port: env.get("PORT").default(3000).required().asPortNumber(),
  apiPort: env.get("API_PORT").default(3001).required().asPortNumber(),
  redisUri: env
    .get("REDIS_URI")
    .default("redis://127.0.0.1:6379")
    .required()
    .asString(),
  kafkaBrokers: env
    .get("KAFKA_BROKERS")
    .default("127.0.0.1:9092")
    .required()
    .asArray(","),
  kafkaTopicNamespace: env
    .get("KAFKA_TOPIC_NAMESPACE")
    .default("test")
    .required()
    .asString(),
  serviceUrls: {
    monitor: env
      .get("MONITOR_SERVICE_API_URL")
      .default("http://bad-url")
      .required()
      .asUrlString(),
  },
  vaultToken: env.get("VAULT_TOKEN").default("test").required().asString(),
  vaultEndpointToKv: env
    .get("VAULT_ENDPOINT_TO_KV")
    .default("http://localhost:8200/v1/secret")
    .required()
    .asUrlString(),
  tokenExpirationTime: env
    .get("TOKEN_EXPIRATION_TIME")
    .default(15 * 60 * 1000)
    .required()
    .asInt(),
  affirmationCodeLength: env.get("AFFIRMATION_CODE_LENGTH").default(6).asInt(),
  affirmationEmailFrom: env
    .get("AFFIRMATION_EMAIL_FROM")
    .default("noreply@email.com")
    .asString(),
  affirmationEmailSubject: env
    .get("AFFIRMATION_EMAIL_SUBJECT")
    .default("Affirmation")
    .asString(),
  affirmationEmailSender: env
    .get("AFFIRMATION_EMAIL_SENDER")
    .default("TEST")
    .asString(),
  affirmationSmsMessage: env
    .get("AFFIRMATION_SMS_MESSAGE")
    .default("Your affirmation code is: {{affirmation}}")
    .asString(),
  verificationCodeTtl: env.get("VERIFICATION_CODE_TTL").default(15).asInt(),
  resendTimeInSeconds: env.get("RESEND_TIME_IN_SECONDS").default(15).asInt(),
  affirmationCodeTemplateName: env
    .get("AFFIRMATION_CODE_TEMPLATE_NAME")
    .default("identity_affirmation_code")
    .asString(),
  maxAttemptsToVerify: env
    .get("MAX_ATTEMPTS_TO_VERIFY")
    .default(3)
    .required()
    .asInt(),
  keycloakBaseUrl: env
    .get("KEYCLOAK_BASE_URL")
    .default("http://localhost:8080")
    .required()
    .asUrlString(),
  keycloakClientId: env
    .get("KEYCLOAK_CLIENT_ID")
    .default("iam-service")
    .required()
    .asString(),
  accessTokenExpireGapInSeconds: env
    .get("ACCESS_TOKEN_EXPIRE_GAP_IN_SECONDS")
    .default(60)
    .required()
    .asInt(),
  etcdNamespace: env
    .get("ETCD_NAMESPACE")
    .default("/stage/iam/realms/")
    .required()
    .asString(),
  etcdUri: env
    .get("ETCD_URI")
    .default("https://localhost:2379")
    .required()
    .asUrlString(),
  rootCaCertPath: env
    .get("ROOT_CA_CERT_PATH")
    .default("../../certs/root-ca.crt")
    .required()
    .asString(),
  etcdUsername: env.get("ETCD_USERNAME").asString(),
  etcdPassword: env.get("ETCD_PASSWORD").asString(),
  rateLimiterTtl: env.get("RATE_LIMITER_TTL").default(60).required().asInt(),
  rateLimiterLimit: env
    .get("RATE_LIMITER_LIMIT")
    .default(120)
    .required()
    .asInt(),
});
