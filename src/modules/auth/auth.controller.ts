import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.service.login(body.username, body.password);
  }

  // Superadmin creates town admins
  @Post('admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  createAdmin(@Body() dto: { username: string; password: string; role: string; townId?: string }) {
    return this.service.createAdmin(dto);
  }
}
