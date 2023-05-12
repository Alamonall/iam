import { Module } from '@nestjs/common';
import VaultService from './vault.service';

@Module({
  providers: [VaultService],
  exports: [VaultService],
})
export default class VaultModule {}
