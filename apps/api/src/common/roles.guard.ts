import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleName } from '@clipforge/types';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ROLES_KEY, type AuthUser } from './decorators';

/**
 * RBAC guard. Requires the caller to hold one of the @Roles on the team referenced by the
 * request (teamId in params/body/query). Platform admins bypass team-role checks.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.isAdmin) return true;

    const teamId = req.params?.teamId ?? req.body?.teamId ?? req.query?.teamId;
    if (!teamId) throw new ForbiddenException('teamId required for role check');

    const membership = await this.prisma.membership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this team');

    const role = membership.role.toLowerCase() as RoleName;
    if (!required.includes(role)) {
      throw new ForbiddenException(`Requires one of roles: ${required.join(', ')}`);
    }
    return true;
  }
}
