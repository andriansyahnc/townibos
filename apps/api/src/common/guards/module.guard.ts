import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from '../decorators/require-module.decorator';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (user?.role === 'superadmin') return true;

    const enabled: string[] = user?.enabledModules ?? [];
    if (!enabled.includes(required)) {
      throw new ForbiddenException(`Module '${required}' is not enabled for this organization`);
    }
    return true;
  }
}
