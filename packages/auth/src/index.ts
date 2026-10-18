import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@roomtrace/types';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private accessSecret: string;
  private refreshSecret: string;

  constructor(accessSecret?: string, refreshSecret?: string) {
    this.accessSecret = accessSecret || process.env.JWT_ACCESS_SECRET || 'roomtrace_default_access_secret_key_32_bytes!';
    this.refreshSecret = refreshSecret || process.env.JWT_REFRESH_SECRET || 'roomtrace_default_refresh_secret_key_32_bytes!';
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.accessSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: payload.userId }, this.refreshSecret, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessSecret) as TokenPayload;
    } catch {
      throw new Error('INVALID_TOKEN');
    }
  }

  verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.refreshSecret) as { userId: string };
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * RBAC Hierarchy: OWNER > ADMIN > MEMBER > VIEWER
   */
  hasPermission(userRole: Role, requiredRole: Role): boolean {
    const hierarchy: Record<Role, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      VIEWER: 1,
    };
    return hierarchy[userRole] >= hierarchy[requiredRole];
  }
}
