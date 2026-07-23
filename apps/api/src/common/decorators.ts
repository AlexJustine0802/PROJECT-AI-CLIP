import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RoleName } from '@clipforge/types';

export const IS_PUBLIC_KEY = 'isPublic';
/** Mark a route as accessible without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Require the caller to hold one of these roles on the target team. */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

/** Inject the authenticated user resolved by JwtAuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest();
  return req.user as AuthUser;
});
