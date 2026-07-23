import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { IS_PUBLIC_KEY, type AuthUser } from './decorators';

/**
 * Validates the JWT issued by Auth.js in the web app (shared HS256 secret). Business logic
 * never re-implements auth — it trusts req.user set here. Works for REST and GraphQL contexts.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly secret: Uint8Array;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.secret = new TextEncoder().encode(config.get<string>('jwt.secret')!);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = this.getRequest(context);
    const token = this.extract(req);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      const { payload } = await jwtVerify(token, this.secret);
      const user: AuthUser = {
        id: (payload.sub ?? payload.id) as string,
        email: payload.email as string,
        isAdmin: Boolean(payload.isAdmin),
      };
      if (!user.id) throw new Error('no subject');
      req.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getRequest(context: ExecutionContext): any {
    if (context.getType<'graphql'>() === 'graphql') {
      // Lazy import to avoid a hard dependency in REST-only contexts.
      const { GqlExecutionContext } = require('@nestjs/graphql');
      return GqlExecutionContext.create(context).getContext().req;
    }
    return context.switchToHttp().getRequest();
  }

  private extract(req: { headers?: Record<string, string> }): string | null {
    const header = req.headers?.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
