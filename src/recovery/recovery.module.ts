import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import RecoveryController from './recovery.controller';
import RecoveryService from './recovery.service';
import AffirmationModule from '../affirmation/affirmation.module';
import JwtModule from '../jwt/jwt.module';
import KeycloakModule from '../keycloak/keycloak.module';
import RealmMiddleware from '../realm.middleware';
import VaultModule from '../vault/vault.module';

@Module({
  imports: [JwtModule, AffirmationModule, KeycloakModule, VaultModule],
  providers: [RecoveryService],
  exports: [RecoveryService],
  controllers: [RecoveryController],
})
export default class RecoveryModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RealmMiddleware).forRoutes(RecoveryController);
  }
}
