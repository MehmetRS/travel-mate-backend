import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginRequestDto, RegisterRequestDto } from '../dtos/auth.dto';
import type { LoginResponse } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() credentials: LoginRequestDto): Promise<LoginResponse> {
    return this.authService.login(credentials);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() data: RegisterRequestDto): Promise<LoginResponse> {
    return this.authService.register(data);
  }
}
