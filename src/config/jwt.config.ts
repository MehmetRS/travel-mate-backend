import type { JwtSignOptions } from '@nestjs/jwt';

interface JwtConfig {
  secret: string;
  expiresIn: JwtSignOptions['expiresIn'];
}

export const jwtConfig: JwtConfig = {
  secret: process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-production',
  expiresIn: '1h',
};
