import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and receive a JWT' })
  login(@Body() body: { username: string; password: string }) {
    return this.service.login(body.username, body.password);
  }

  @Post('admins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create a town admin (superadmin)' })
  createAdmin(@Body() dto: { username: string; password: string; role: string; townId?: string }) {
    return this.service.createAdmin(dto);
  }
}
