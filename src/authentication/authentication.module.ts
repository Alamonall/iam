import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import AuthenticationService from './authentication.service';
import AuthenticationController from './authentication.controller';
import RealmMiddleware from '../realm.middleware';
import JwtModule from '../jwt/jwt.module';
import AffirmationModule from '../affirmation/affirmation.module';
import KeycloakModule from '../keycloak/keycloak.module';
import VaultModule from '../vault/vault.module';
import RecoveryModule from '../recovery/recovery.module';

@Module({
  imports: [
    JwtModule,
    AffirmationModule,
    KeycloakModule,
    VaultModule,
    RecoveryModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export default class AuthenticationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealmMiddleware).forRoutes(AuthenticationController);
  }
}
