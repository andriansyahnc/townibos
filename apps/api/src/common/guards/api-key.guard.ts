import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const apiKey = this.config.get<string>('adminApiKey');
    if (!apiKey) throw new UnauthorizedException('ADMIN_API_KEY is not configured');

    const request = ctx.switchToHttp().getRequest();
    const provided = request.headers['x-api-key'];
    if (!provided || provided !== apiKey) throw new UnauthorizedException('Invalid API key');

    return true;
  }
}
