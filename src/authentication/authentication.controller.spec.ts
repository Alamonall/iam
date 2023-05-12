import { Test, TestingModule } from '@nestjs/testing';
import RecoveryService from '../recovery/recovery.service';
import AuthenticationController from './authentication.controller';
import AuthenticationService from './authentication.service';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;

  const mockAuthenticationService = {
    provide: AuthenticationService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  const mockRecoveryService = {
    provide: RecoveryService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [mockAuthenticationService, mockRecoveryService],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
