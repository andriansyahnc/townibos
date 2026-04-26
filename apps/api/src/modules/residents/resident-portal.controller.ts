import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResidentsService } from './residents.service';

class RequestMagicLinkDto {
  @ApiProperty({ example: 'penghuni@example.com' })
  @IsEmail()
  email: string;
}

class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  phone?: string;
}

@ApiTags('resident-portal')
@Controller('residents/portal')
export class ResidentPortalController {
  constructor(private readonly service: ResidentsService) {}

  @Post('request-link')
  @ApiOperation({ summary: 'Request a magic link to log in (public)' })
  async requestLink(@Body() dto: RequestMagicLinkDto) {
    await this.service.requestMagicLink(dto.email);
    return { sent: true };
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify magic link token and receive JWT (public)' })
  verify(@Query('token') token: string) {
    return this.service.verifyMagicLink(token);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('resident')
  @ApiOperation({ summary: 'Get own resident profile' })
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getMe(user.userId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('resident')
  @ApiOperation({ summary: 'Update own resident profile' })
  updateMe(@Body() dto: UpdateProfileDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.updateMe(user.userId, dto);
  }
}
