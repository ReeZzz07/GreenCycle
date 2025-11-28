import { BadRequestException, Body, Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { Public } from '../common/decorators/public.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RefreshJwtGuard } from '../common/guards/refresh-jwt.guard';

// Строгие лимиты для аутентификации: 5 запросов в 60 секунд (защита от brute force)
const AUTH_THROTTLE_LIMIT = parseInt(process.env.THROTTLER_AUTH_LIMIT ?? '5', 10);
const AUTH_THROTTLE_TTL = parseInt(process.env.THROTTLER_AUTH_TTL ?? '60', 10) * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({
    default: {
      limit: AUTH_THROTTLE_LIMIT,
      ttl: AUTH_THROTTLE_TTL,
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход в систему', description: 'Авторизация пользователя по email и паролю' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Успешная авторизация', type: TokenPairDto })
  @ApiResponse({ status: 400, description: 'Неверные учетные данные' })
  @ApiResponse({ status: 429, description: 'Превышен лимит запросов (5 запросов в 60 секунд)' })
  async login(@Body() loginDto: LoginDto): Promise<{ data: TokenPairDto }> {
    const tokens = await this.authService.login(loginDto);
    return { data: tokens };
  }

  @Public()
  @Throttle({
    default: {
      limit: AUTH_THROTTLE_LIMIT,
      ttl: AUTH_THROTTLE_TTL,
    },
  })
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление токена', description: 'Обновление access token с помощью refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Токены успешно обновлены', type: TokenPairDto })
  @ApiResponse({ status: 400, description: 'Неверный refresh token' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 429, description: 'Превышен лимит запросов (5 запросов в 60 секунд)' })
  async refresh(
    @CurrentUser() user: { id: number },
    @Body() refreshDto: RefreshTokenDto
  ): Promise<{ data: TokenPairDto }> {
    if (!refreshDto.refreshToken) {
      throw new BadRequestException('Refresh token обязателен');
    }
    const tokens = await this.authService.refresh(user);
    return { data: tokens };
  }
}

