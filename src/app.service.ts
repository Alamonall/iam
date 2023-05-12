import { Injectable } from '@nestjs/common';

@Injectable()
export default class AppService {
  ping(): string {
    return 'pong';
  }
}
