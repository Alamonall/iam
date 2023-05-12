import { Test, TestingModule } from '@nestjs/testing';
import ServiceRouterService from './service-router.service';

describe('ServiceRouterService', () => {
  let service: ServiceRouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceRouterService],
    }).compile();

    service = module.get<ServiceRouterService>(ServiceRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
