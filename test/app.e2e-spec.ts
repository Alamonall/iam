/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import KcAdminClient from "@keycloak/keycloak-admin-client";
import * as request from "supertest";

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { generateKeyPairSync } from "crypto";
import { Etcd3 } from "etcd3";
import { readFileSync } from "fs";
import { Logger } from "nestjs-pino";
import { resolve } from "path";
import AffirmationService from "../src/affirmation/affirmation.service";
import AppModule from "../src/app.module";
import getConfig from "../src/config";
import EventTransporterService from "../src/event-transporter/event-transporter.service";
import DefaultErrorFilter from "../src/filters/DefaultErrorFilter";
import ErrorFilter from "../src/filters/ErrorFilter";
import HttpExceptionFilter from "../src/filters/HttpExceptionFilter";
import HealthReporterService from "../src/health-reporter/health-reporter.service";
import JwtService from "../src/jwt/jwt.service";
import { JwtType } from "../src/jwt/types";
import KeycloakService from "../src/keycloak/keycloak.service";
import { getActionByCode } from "../src/utils";
import VaultService from "../src/vault/vault.service";

const captcha = "10000000-aaaa-bbbb-cccc-000000000001";
const realmName = "master";
const realmHeader = {
  "X-Realm-Name": realmName,
};
const FakeData = {
  phone: faker.phone.number("+79#########"),
  email: faker.internet.email(),
  password: {
    new: faker.internet.password(),
    old: faker.internet.password(),
  },
};

const SecondFakeData = {
  phone: faker.phone.number("+79#########"),
  email: faker.internet.email(),
  password: {
    new: faker.internet.password(),
    old: faker.internet.password(),
  },
};

let vault: VaultKeyValue;
let app: INestApplication;
let jwtService: JwtService;
let eventTransporterService;
let hostApp = "http://localhost:3001";
jest.setTimeout(100000);

beforeAll(async () => {
  // #region init
  const {
    vaultEndpointToKv,
    keycloakBaseUrl,
    vaultToken,
    etcdUri,
    etcdNamespace,
  } = getConfig();

  console.log("preparing tests");

  vault = new VaultKeyValue({
    endpointToEngine: vaultEndpointToKv,
    token: vaultToken,
  });

  const keyPair = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  await vault.updateSecret("token_keys", {
    data: {
      private_key: keyPair.privateKey,
      public_key: keyPair.publicKey,
    },
  });

  await vault.updateSecret("hcaptcha", {
    data: {
      secret_key: "0x0000000000000000000000000000000000000000",
      site_key: "10000000-ffff-ffff-ffff-000000000001",
    },
  });

  console.log("keycloak_init");
  const kcAdminClient = new KcAdminClient({
    baseUrl: keycloakBaseUrl,
  });
  console.log("keylocka_client_created");

  await kcAdminClient.auth({
    username: "admin",
    password: "admin",
    grantType: "password",
    clientId: "admin-cli",
  });

  const clientId = "iam-service";

  console.log("keylocka_client_authorized");

  const allClients = await kcAdminClient.clients.find({ clientId });
  let tempClient = allClients[0];
  if (tempClient == null) {
    console.log("creating_keycloak_client", tempClient);
    const createdClient = await kcAdminClient.clients.create({
      clientId,
      directAccessGrantsEnabled: true,
      defaultRoles: ["manage-users", "query-users", "view-users"],
    });

    await kcAdminClient.clients.update(
      {
        id: createdClient.id,
      },
      {
        clientId,
        serviceAccountsEnabled: true,
      }
    );

    const credential = await kcAdminClient.clients.getClientSecret({
      id: createdClient.id,
    });

    await vault.updateSecret("keycloak_clients", {
      data: {
        master: credential.value,
      },
    });

    console.log({ credential });

    const roleName = "custom-admin";
    const { roleName: createdRoleName } =
      await kcAdminClient.clients.createRole({
        id: createdClient.id,
        name: roleName,
      });

    console.log({ msg: "created_role_name", role_name: createdRoleName });

    const roles = await kcAdminClient.clients.listRoles({
      id: createdClient.id,
    });
    console.log({ msg: "get client roles", roles });

    const clientRole = await kcAdminClient.clients.findRole({
      id: createdClient.id,
      roleName: createdRoleName,
    });
    console.log({ msg: "client_role", client_role: clientRole });

    const user = await kcAdminClient.users.find({
      username: `service-account-${clientId.toLocaleLowerCase()}`,
    });
    console.log({ msg: "user-client", user });

    const allRoles = await kcAdminClient.roles.find();

    console.log({ allRoles });
    const adminRole = allRoles.find((role) => role.name === "admin");
    await kcAdminClient.users.addRealmRoleMappings({
      id: user[0].id,
      roles: [
        {
          id: adminRole.id,
          name: adminRole.name,
        },
      ],
    });

    tempClient = createdClient;
    console.log({ msg: "end_creating_new_client" });
  }

  console.log({ msg: "keycloak_client", tempClient });
  const credential = await kcAdminClient.clients.getClientSecret({
    id: tempClient.id,
  });

  await vault.updateSecret("keycloak_clients", {
    data: {
      master: credential.value,
    },
  });

  console.log({
    tempClient,
    cert_path: resolve(__dirname, "./etcd_certs/host.cert"),
    uri: etcdUri.replace(/\/$/, ""),
  });
  try {
    const client = new Etcd3({
      credentials: {
        rootCertificate: readFileSync(
          resolve(__dirname, "./etcd_certs/host.cert")
        ),
      },
      hosts: [etcdUri.replace(/\/$/, "")],
    });
    console.log("etcd_init");

    const stage = client.namespace(etcdNamespace);
    await stage
      .put(`${realmName}/required_actions`)
      .value(JSON.stringify(["email", "phone"]));

    console.log("etcd_data_inited", realmName);
  } catch (err) {
    console.error(err);
  }

  app = await NestFactory.create(AppModule);

  jwtService = app.get(JwtService);
  const vaultService = app.get(VaultService);
  const vaultResponse = await vaultService.readSecretVersion(
    "keycloak_clients"
  );

  if (vaultResponse.status !== "OK") {
    throw new Error("Cant get data from Vault");
  }
  const logger = app.get(Logger);
  const affirmationService = app.get<AffirmationService>(AffirmationService);
  eventTransporterService = app.get<EventTransporterService>(
    EventTransporterService
  );
  const keycloakService = app.get<KeycloakService>(KeycloakService);
  const healthReporter = app.get(HealthReporterService);
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  app.useGlobalFilters(
    new ErrorFilter(logger),
    new DefaultErrorFilter(logger),
    new HttpExceptionFilter(logger)
  );
  await app.init();
  await jwtService.init();
  eventTransporterService.installJobsAndWorkers();
  await eventTransporterService.start();
  await keycloakService.init();
  await affirmationService.init();
  await healthReporter.start();
  app.enableShutdownHooks();
  hostApp = app.getHttpServer();

  // #endregion init
  console.log("application setup ended");
});

afterAll(async () => {
  await app.close();
});

describe("check connection", () => {
  it("ping-pong", () => {
    return request(hostApp).get("/").expect(200);
  });
});

describe("Registration (e2e)", () => {
  let registrationToken: string;
  let requiredActions;

  it("POST init registration", async () => {
    await request(hostApp)
      .post("/registration/init")
      .set(realmHeader)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST 1 /registration/affirmation/init", async () => {
    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: FakeData[requiredActions[0]],
    };
    console.log({ postData });
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST 1 wrong ver code /registration/affirmation/init", async () => {
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send({
        registration_token: registrationToken,
        action: requiredActions[0],
        value: "FAKE",
      })
      .expect(400);
  });

  it(`POST 1 /registration/affirmation/complete `, async () => {
    const { context } = jwtService.decode({
      token: registrationToken,
      type: JwtType.REGISTRATION,
    });

    const subject = getActionByCode({ code: requiredActions[0] });

    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: context[subject].verification_code,
    };
    await request(hostApp)
      .post("/registration/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST 2 wrong ver code /registration/affirmation/init", async () => {
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send({
        registration_token: registrationToken,
        action: requiredActions[0],
        value: "FAKE",
      })
      .expect(400);
  });

  it("POST 2 /registration/affirmation/init", async () => {
    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: FakeData[requiredActions[0]],
      captcha,
    };
    console.log(postData);
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it(`POST 2 /registration/affirmation/complete `, async () => {
    const { context } = await jwtService.decode({
      token: registrationToken,
      type: JwtType.REGISTRATION,
    });

    const action = getActionByCode({ code: requiredActions[0] });
    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: context[action].verification_code,
    };
    await request(hostApp)
      .post("/registration/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(data.body.required_actions.length).toBe(0);
        expect(typeof data.body.registration_token).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /registration/complete", async () => {
    const postData = {
      registration_token: registrationToken,
      secret: FakeData.password.old,
    };
    await request(hostApp)
      .post("/registration/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("access_token");
        expect(data.body).toHaveProperty("refresh_token");
        expect(data.body).toHaveProperty("expires_at");
        expect(typeof data.body.access_token).toBe("string");
        expect(typeof data.body.refresh_token).toBe("string");
        expect(typeof data.body.expires_at).toBe("string");
      });
  });
});

describe("Authetication by Email (e2e)", () => {
  let authToken;
  let requiredActions;
  it("POST /auth/init by email", async () => {
    const postData = {
      action: "email",
      value: FakeData.email,
      secret: FakeData.password.old,
    };
    await request(hostApp)
      .post("/authentication/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/init by email", async () => {
    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
    };
    await request(hostApp)
      .post("/authentication/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body).toHaveProperty("mask");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        expect(typeof data.body.mask).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/complete by email", async () => {
    const { context } = await jwtService.decode({
      token: authToken,
      type: JwtType.AUTHENTICATION,
    });

    const action = getActionByCode({ code: requiredActions[0] });
    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
      value: context[action].verification_code,
    };
    await request(hostApp)
      .post("/authentication/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/complete by email", async () => {
    const postData = {
      auth_token: authToken,
    };
    await request(hostApp)
      .post("/authentication/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("access_token");
        expect(data.body).toHaveProperty("refresh_token");
        expect(data.body).toHaveProperty("expires_at");
        expect(typeof data.body.access_token).toBe("string");
        expect(typeof data.body.refresh_token).toBe("string");
        expect(typeof data.body.expires_at).toBe("string");
        console.log(data.body.access_token);
      });
  });
});

describe("Authetication by phone (e2e)", () => {
  let authToken;
  let requiredActions;

  it("POST /auth/init by phone", async () => {
    const postData = {
      action: "phone",
      value: FakeData.phone,
      secret: FakeData.password.old,
    };
    await request(hostApp)
      .post("/authentication/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/init by phone", async () => {
    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
    };
    await request(hostApp)
      .post("/authentication/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body).toHaveProperty("mask");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        expect(typeof data.body.mask).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/complete by phone", async () => {
    const { context } = await jwtService.decode({
      token: authToken,
      type: JwtType.AUTHENTICATION,
    });
    const action = getActionByCode({ code: requiredActions[0] });

    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
      value: context[action].verification_code,
    };
    await request(hostApp)
      .post("/authentication/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/complete by phone", async () => {
    const postData = {
      auth_token: authToken,
    };
    await request(hostApp)
      .post("/authentication/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("access_token");
        expect(data.body).toHaveProperty("refresh_token");
        expect(data.body).toHaveProperty("expires_at");
        expect(typeof data.body.access_token).toBe("string");
        expect(typeof data.body.refresh_token).toBe("string");
        expect(typeof data.body.expires_at).toBe("string");
      });
  });
});

describe("Reset password", () => {
  let token;
  let actions;

  it("POST password reset init", async () => {
    await request(hostApp)
      .post("/recovery/password/reset/init")
      .set(realmHeader)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("reset_password_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(typeof data.body.reset_password_token).toBe("string");
        token = data.body.reset_password_token;
        actions = data.body.required_actions;
      });
  });

  it("POST password reset init affirmation", async () => {
    const postData = {
      reset_password_token: token,
      action: "email",
      value: FakeData.email,
    };

    await request(hostApp)
      .post("/recovery/password/reset/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("reset_password_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(typeof data.body.reset_password_token).toBe("string");
        token = data.body.reset_password_token;
        actions = data.body.required_actions;
      });
  });

  it("POST password reset complete affirmation", async () => {
    const { context } = await jwtService.decode({
      token,
      type: JwtType.PASSWORD_RESET,
    });
    const subject = getActionByCode({ code: actions[0] });

    const postData = {
      reset_password_token: token,
      action: actions[0],
      value: context[subject].verification_code,
      secret: FakeData.password.new,
    };
    await request(hostApp)
      .post("/recovery/password/reset/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("reset_password_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.reset_password_token).toBe("string");
        token = data.body.reset_password_token;
        actions = data.body.required_actions;
      });
  });

  it("POST reset password complete", async () => {
    const postData = {
      reset_password_token: token,
    };
    await request(hostApp)
      .post("/recovery/password/reset/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200);
  });
});

describe("Authetication by email after change password with OLD PASSWORD (e2e)", () => {
  let authToken;
  let requiredActions;

  it("POST /auth/init by email", async () => {
    const postData = {
      action: "email",
      value: FakeData.email,
      secret: FakeData.password.old,
    };
    console.log({ postData });
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 16000));

    await request(hostApp)
      .post("/authentication/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/init by email", async () => {
    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
    };
    console.log({ postData });
    await request(hostApp)
      .post("/authentication/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body).toHaveProperty("mask");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        expect(typeof data.body.mask).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/complete by email", async () => {
    const { context } = await jwtService.decode({
      token: authToken,
      type: JwtType.AUTHENTICATION,
    });

    const action = getActionByCode({ code: requiredActions[0] });
    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
      value: context[action].verification_code,
    };
    await request(hostApp)
      .post("/authentication/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/complete by email", async () => {
    const postData = {
      auth_token: authToken,
    };
    await request(hostApp)
      .post("/authentication/complete")
      .set(realmHeader)
      .send(postData)
      .expect(401);
  });
});

describe("Authetication by Email after change password with NEW PASSWORD (e2e)", () => {
  let authToken;
  let requiredActions;

  it("POST /auth/init by email", async () => {
    const postData = {
      action: "email",
      value: FakeData.email,
      secret: FakeData.password.new,
    };
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 16000));
    await request(hostApp)
      .post("/authentication/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/init by email", async () => {
    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
    };
    await request(hostApp)
      .post("/authentication/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body).toHaveProperty("mask");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        expect(typeof data.body.mask).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/affirm/complete by email", async () => {
    const { context } = await jwtService.decode({
      token: authToken,
      type: JwtType.AUTHENTICATION,
    });

    const action = getActionByCode({ code: requiredActions[0] });
    const postData = {
      action: requiredActions[0],
      auth_token: authToken,
      value: context[action].verification_code,
    };
    await request(hostApp)
      .post("/authentication/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("auth_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.auth_token).toBe("string");
        authToken = data.body.auth_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST /auth/complete by email", async () => {
    const postData = {
      auth_token: authToken,
    };
    await request(hostApp)
      .post("/authentication/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("access_token");
        expect(data.body).toHaveProperty("refresh_token");
        expect(data.body).toHaveProperty("expires_at");
        expect(typeof data.body.access_token).toBe("string");
        expect(typeof data.body.refresh_token).toBe("string");
        expect(typeof data.body.expires_at).toBe("string");
      });
  });
});

describe("Registration with resend(e2e)", () => {
  let registrationToken: string;
  let requiredActions;

  it("POST init registration", async () => {
    await request(hostApp)
      .post("/registration/init")
      .set(realmHeader)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST 1 /registration/affirmation/init", async () => {
    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: SecondFakeData[requiredActions[0]],
    };
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST 1 wrong ver code /registration/affirmation/init", async () => {
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send({
        registration_token: registrationToken,
        action: requiredActions[0],
        value: "FAKE",
      })
      .expect(400);
  });

  it(`POST 1 /registration/affirmation/complete `, async () => {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 16000));
    const { context } = await jwtService.decode({
      token: registrationToken,
      type: JwtType.REGISTRATION,
    });

    const subject = getActionByCode({ code: requiredActions[0] });

    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: context[subject].verification_code,
    };
    await request(hostApp)
      .post("/registration/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(400);
    // .then((data) => {
    //   expect(data.body).toHaveProperty('registration_token');
    //   expect(data.body).toHaveProperty('required_actions');
    //   expect(data.body.required_actions).toBeInstanceOf(Array);
    //   expect(typeof data.body.registration_token).toBe('string');
    //   registrationToken = data.body.registration_token;
    //   requiredActions = data.body.required_actions;
    // });
  });

  it(`POST 1 /affirmation/resend `, async () => {
    const postData = {
      token: registrationToken,
    };
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 16000));

    await request(hostApp)
      .post("/registration/affirmation/resend")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.token).toBe("string");
        registrationToken = data.body.token;
        requiredActions = data.body.required_actions;
      });
  });

  it(`POST 1 /registration/affirmation/complete `, async () => {
    const { context } = await jwtService.decode({
      token: registrationToken,
      type: JwtType.REGISTRATION,
    });

    const subject = getActionByCode({ code: requiredActions[0] });

    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: context[subject].verification_code,
    };
    await request(hostApp)
      .post("/registration/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
        console.log({
          msg: "required_actions_after_first_affirmation",
          requiredActions,
        });
      });
  });

  it("POST 2 wrong ver code /registration/affirmation/init", async () => {
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send({
        registration_token: registrationToken,
        action: requiredActions[0],
        value: "FAKE",
      })
      .expect(400);
  });

  it("POST 2 /registration/affirmation/init", async () => {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 16000));

    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: SecondFakeData[requiredActions[0]],
      captcha,
    };
    await request(hostApp)
      .post("/registration/affirmation/init")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.registration_token).toBe("string");
        expect(typeof data.body.resend_date).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it(`POST 2 /registration/affirmation/complete `, async () => {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 16000));
    const { context } = await jwtService.decode({
      token: registrationToken,
      type: JwtType.REGISTRATION,
    });

    const subject = getActionByCode({ code: requiredActions[0] });

    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: context[subject].verification_code,
    };
    await request(hostApp)
      .post("/registration/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(400);
    // .then((data) => {
    //   expect(data.body).toHaveProperty('registration_token');
    //   expect(data.body).toHaveProperty('required_actions');
    //   expect(data.body.required_actions).toBeInstanceOf(Array);
    //   expect(typeof data.body.registration_token).toBe('string');
    //   registrationToken = data.body.registration_token;
    //   requiredActions = data.body.required_actions;
    // });
  });

  it(`POST 2 /affirmation/resend `, async () => {
    const postData = {
      token: registrationToken,
    };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { context, required_actions, realm_name, on_verification } =
      await jwtService.decode({
        token: registrationToken,
        type: JwtType.REGISTRATION,
      });
    console.log({
      msg: "resend_token_info",
      registrationToken,
      context,
      required_actions,
      realm_name,
      on_verification,
    });
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 16000));

    await request(hostApp)
      .post("/registration/affirmation/resend")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body).toHaveProperty("resend_date");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(typeof data.body.token).toBe("string");
        registrationToken = data.body.token;
        requiredActions = data.body.required_actions;
      });
  });

  it(`POST 2 /registration/affirmation/complete `, async () => {
    const { context } = await jwtService.decode({
      token: registrationToken,
      type: JwtType.REGISTRATION,
    });

    const action = getActionByCode({ code: requiredActions[0] });
    const postData = {
      registration_token: registrationToken,
      action: requiredActions[0],
      value: context[action].verification_code,
    };
    await request(hostApp)
      .post("/registration/affirmation/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("registration_token");
        expect(data.body).toHaveProperty("required_actions");
        expect(data.body.required_actions).toBeInstanceOf(Array);
        expect(data.body.required_actions.length).toBe(0);
        expect(typeof data.body.registration_token).toBe("string");
        registrationToken = data.body.registration_token;
        requiredActions = data.body.required_actions;
      });
  });

  it("POST 2 /registration/complete", async () => {
    const postData = {
      registration_token: registrationToken,
      secret: SecondFakeData.password.old,
    };
    await request(hostApp)
      .post("/registration/complete")
      .set(realmHeader)
      .send(postData)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty("access_token");
        expect(data.body).toHaveProperty("refresh_token");
        expect(data.body).toHaveProperty("expires_at");
        expect(typeof data.body.access_token).toBe("string");
        expect(typeof data.body.refresh_token).toBe("string");
        expect(typeof data.body.expires_at).toBe("string");
      });
  });
});
