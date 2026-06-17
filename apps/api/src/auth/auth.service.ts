import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthResponse, LoginRequest } from '@vehiclelinq/shared';
import { DatabaseService } from '../database/database.service';
import { getConfig } from '../config/env';
import type { AuthTokenPayload, AuthUser } from './auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async login(body: LoginRequest): Promise<AuthResponse> {
    try {
      this.logger.log(`Login attempt for ${body?.email ?? 'unknown-email'}`);

      const result = await this.database.query<{
        id: string;
        email: string;
        display_name: string;
        role: AuthUser['role'];
        company_id: string | null;
        password_hash: string;
      }>(
        `
          SELECT id, email, display_name, role, company_id, password_hash
          FROM users
          WHERE email = $1 AND is_active = TRUE
        `,
        [body.email.toLowerCase()],
      );

      const userRow = result.rows[0];
      if (!userRow) {
        this.logger.warn(`Login failed: user not found for ${body.email}`);
        throw new UnauthorizedException('Ongeldige inloggegevens.');
      }

      const passwordMatches = await compare(body.password, userRow.password_hash);
      if (!passwordMatches) {
        this.logger.warn(`Login failed: password mismatch for ${body.email}`);
        throw new UnauthorizedException('Ongeldige inloggegevens.');
      }

      const user: AuthUser = {
        id: userRow.id,
        email: userRow.email,
        displayName: userRow.display_name,
        role: userRow.role,
        companyId: userRow.company_id,
      };

      this.logger.log(`Login credentials accepted for ${body.email}, signing tokens`);

      return {
        accessToken: this.signAccessToken(user),
        refreshToken: this.signRefreshToken(user),
        user,
      };
    } catch (error) {
      this.logger.error(
        `Login failed with unexpected error for ${body?.email ?? 'unknown-email'}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const result = await this.database.query<{
      id: string;
      email: string;
      display_name: string;
      role: AuthUser['role'];
      company_id: string | null;
    }>(
      `
        SELECT id, email, display_name, role, company_id
        FROM users
        WHERE id = $1
      `,
      [userId],
    );

    const user = result.rows[0];
    if (!user) {
      throw new UnauthorizedException('Gebruiker niet gevonden.');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      companyId: user.company_id,
    };
  }

  verifyAccessToken(token: string): AuthTokenPayload {
    return jwt.verify(token, getConfig().jwtSecret) as AuthTokenPayload;
  }

  refresh(refreshToken: string): AuthResponse {
    const payload = jwt.verify(
      refreshToken,
      getConfig().jwtRefreshSecret,
    ) as AuthTokenPayload;
    const user: AuthUser = {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      role: payload.role,
      companyId: payload.companyId,
    };

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
      user,
    };
  }

  private signAccessToken(user: AuthUser): string {
    return jwt.sign(this.toPayload(user), getConfig().jwtSecret, {
      expiresIn: '1h',
    });
  }

  private signRefreshToken(user: AuthUser): string {
    return jwt.sign(this.toPayload(user), getConfig().jwtRefreshSecret, {
      expiresIn: '7d',
    });
  }

  private toPayload(user: AuthUser): AuthTokenPayload {
    return {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      companyId: user.companyId,
    };
  }
}
