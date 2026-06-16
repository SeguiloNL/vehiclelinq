import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { AuthResponse, LoginRequest } from '@vehiclelinq/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import type { AuthUser } from './auth.types';
import { AuthService } from './auth.service';

@Controller('api/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  login(@Body() body: LoginRequest): Promise<AuthResponse> {
    return this.authService.login(body);
  }

  @Post('auth/refresh')
  refresh(@Headers('x-refresh-token') refreshToken?: string): AuthResponse {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token ontbreekt.');
    }

    return this.authService.refresh(refreshToken);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<AuthUser> {
    return this.authService.getCurrentUser(user.id);
  }
}
