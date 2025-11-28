import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../common/services/password.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AppConfig } from '../config/configuration';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService<AppConfig>>;

  const usersServiceMock: Partial<jest.Mocked<UsersService>> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const passwordServiceMock: Partial<jest.Mocked<PasswordService>> = {
    compare: jest.fn(),
  };

  const jwtServiceMock: Partial<jest.Mocked<JwtService>> = {
    signAsync: jest.fn(),
  };

  const configServiceMock: Partial<jest.Mocked<ConfigService<AppConfig>>> = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: PasswordService, useValue: passwordServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    role: { name: 'admin' },
  } as any;

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const loginDto: LoginDto = { email: 'user@example.com', password: 'secret123' };
      usersService.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);

      const result = await authService.validateUser(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(passwordService.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const loginDto: LoginDto = { email: 'wrong@example.com', password: 'secret123' };

      await expect(authService.validateUser(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);
      const loginDto: LoginDto = { email: mockUser.email, password: 'wrong' };

      await expect(authService.validateUser(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const loginDto: LoginDto = { email: mockUser.email, password: 'secret123' };
      usersService.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      configService.get.mockImplementation((key: string) => {
        if (key === 'auth.accessTokenTtl') {
          return '900s' as any;
        }
        if (key === 'auth.refreshTokenTtl') {
          return '7d' as any;
        }
        return undefined as any;
      });

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('should throw BadRequestException if payload missing', async () => {
      await expect(authService.refresh(undefined)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

