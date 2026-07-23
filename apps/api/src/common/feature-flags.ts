import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { FeatureFlags, FlagName } from '@clipforge/core';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly config: ConfigService) {}

  all(): FeatureFlags {
    return this.config.get<FeatureFlags>('flags')!;
  }

  isEnabled(flag: FlagName): boolean {
    return this.all()[flag];
  }
}

export const REQUIRE_FLAG = 'requireFlag';
/** Gate a controller/route behind a feature flag; returns 404 when disabled. */
export const RequireFlag = (flag: FlagName) => SetMetadata(REQUIRE_FLAG, flag);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly flags: FeatureFlagsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.getAllAndOverride<FlagName>(REQUIRE_FLAG, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!flag) return true;
    if (!this.flags.isEnabled(flag)) throw new NotFoundException('Feature not available');
    return true;
  }
}
