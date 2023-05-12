import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

import AppService from './app.service';

@ApiTags('Main')
@Controller()
export default class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiResponse({ status: 200, description: 'Ping-pong!' })
  ping(): string {
    return this.appService.ping();
  }
}
