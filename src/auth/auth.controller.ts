import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginRequestDto, RegisterRequestDto } from '../dtos/auth.dto';
import type { LoginResponse, JwtPayload } from './auth.types';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @Public()
  async login(@Body() credentials: LoginRequestDto): Promise<LoginResponse> {
    return this.authService.login(credentials);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @Public()
  async register(@Body() data: RegisterRequestDto): Promise<LoginResponse> {
    return this.authService.register(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return req.user;
  }
}
