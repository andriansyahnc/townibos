import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and receive a JWT' })
  login(@Body() body: LoginDto) {
    return this.service.login(body.username, body.password);
  }

  @Get('admins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'List all admin users (superadmin)' })
  listAdmins() {
    return this.service.listAdmins();
  }

  @Post('admins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create a town admin (superadmin)' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.service.createAdmin(dto);
  }

  @Delete('admins/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Delete an admin user (superadmin)' })
  removeAdmin(@Param('id') id: string) {
    return this.service.removeAdmin(id);
  }

  @Patch('admins/:id/password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Change any admin password (superadmin)' })
  changeAdminPassword(@Param('id') id: string, @Body() body: ChangePasswordDto) {
    return this.service.changePassword(id, body.newPassword);
  }

  @Patch('me/password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change own password (logged-in user)' })
  changeOwnPassword(@CurrentUser() user: CurrentUserPayload, @Body() body: ChangePasswordDto) {
    return this.service.changePassword(user.userId, body.newPassword);
  }

  @Patch('password')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Reset any admin password by username (API key required)' })
  @ApiHeader({ name: 'x-api-key', description: 'ADMIN_API_KEY from server config', required: true })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.service.changePasswordByUsername(body.username, body.newPassword);
  }
}
