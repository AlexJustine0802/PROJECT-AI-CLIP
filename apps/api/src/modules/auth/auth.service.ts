import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

/**
 * Self-contained auth for the API (credentials → JWT). In the full product the web app's
 * Auth.js issues the same HS256 JWT (Google/GitHub/email); this path keeps the API usable
 * and testable standalone. Passwords hashed with bcrypt.
 */
@Injectable()
export class AuthService {
  private readonly secret: Uint8Array;
  private readonly expiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.secret = new TextEncoder().encode(config.get<string>('jwt.secret')!);
    this.expiresIn = config.get<string>('jwt.expiresIn')!;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });
    // New users get a personal team + free-tier wallet.
    const team = await this.prisma.team.create({
      data: {
        name: dto.name ? `${dto.name}'s Team` : 'My Team',
        slug: `team-${user.id.slice(0, 8)}`,
        memberships: { create: { userId: user.id, role: 'OWNER' } },
        creditWallet: { create: { balance: 30 } },
      },
    });
    return { token: await this.sign(user.id, user.email, user.isAdmin), userId: user.id, teamId: team.id };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (user.twoFactorEnabled && !dto.totp) {
      throw new UnauthorizedException('2FA code required');
    }
    return { token: await this.sign(user.id, user.email, user.isAdmin), userId: user.id };
  }

  private async sign(sub: string, email: string, isAdmin: boolean): Promise<string> {
    return new SignJWT({ email, isAdmin })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.secret);
  }
}
