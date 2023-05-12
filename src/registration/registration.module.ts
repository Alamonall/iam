import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import AffirmationModule from '../affirmation/affirmation.module';
import RegistrationService from './registration.service';
import RegistrationController from './registration.controller';
import JwtModule from '../jwt/jwt.module';
import RedisModule from '../redis/redis.module';
import RealmMiddleware from '../realm.middleware';
import KeycloakModule from '../keycloak/keycloak.module';
import VaultModule from '../vault/vault.module';
import RecoveryModule from '../recovery/recovery.module';
import EventTransporterModule from '../event-transporter/event-transporter.module';

@Module({
  imports: [
    AffirmationModule,
    JwtModule,
    RedisModule,
    KeycloakModule,
    VaultModule,
    RecoveryModule,
    EventTransporterModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
})
export default class RegistrationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RealmMiddleware).forRoutes(RegistrationController);
  }
}
