import { Module } from '@nestjs/common';
import VaultModule from '../vault/vault.module';
import KeycloakService from './keycloak.service';

@Module({
  imports: [VaultModule],
  providers: [KeycloakService],
  exports: [KeycloakService],
})
export default class KeycloakModule {}
