import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@ApiTags('announcements')
@ApiBearerAuth()
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an announcement' })
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === 'admin') (dto as any).townId = user.townId;
    return this.service.create(dto as any);
  }

  @Get()
  @ApiOperation({ summary: 'List announcements' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(user.role === 'admin' ? user.townId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an announcement by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
