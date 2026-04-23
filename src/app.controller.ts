import { Controller, Get } from '@nestjs/common';
import { ok } from './utils/api-response.util';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return ok({
      status: 'ok',
      service: 'perulytics-backend',
      timestamp: new Date().toISOString(),
    });
  }
}
