import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import AuthenticationService from './authentication.service';
import KeycloakService from '../keycloak/keycloak.service';
import AffirmationService from '../affirmation/affirmation.service';
import JwtService from '../jwt/jwt.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  const mockKeycloakService = {
    provide: KeycloakService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  const mockAffirmationService = {
    provide: AffirmationService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  const mockJwtService = {
    provide: JwtService,
    useFactory: () => ({
      getGpa: jest.fn(() => 4.5),
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
      providers: [
        AuthenticationService,
        mockAffirmationService,
        mockJwtService,
        mockKeycloakService,
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
