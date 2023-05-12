import { Module } from '@nestjs/common';
import VaultModule from '../vault/vault.module';
import JwtService from './jwt.service';

@Module({
  imports: [VaultModule],
  providers: [JwtService],
  exports: [JwtService],
})
export default class JwtModule {}
