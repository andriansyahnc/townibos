import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotionService } from './notion.service';

@Controller('notion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotionController {
  constructor(private readonly service: NotionService) {}

  // Superadmin: sync all towns
  @Post('sync')
  @Roles('superadmin')
  syncAll() {
    return this.service.syncAll();
  }

  // Superadmin: sync one specific town
  @Post('sync/:townId')
  @Roles('superadmin')
  syncOne(@Param('townId') townId: string) {
    return this.service.syncOne(townId);
  }

  // Town admin: sync their own town
  @Post('sync/me')
  @Roles('admin')
  syncMine(@CurrentUser() user: CurrentUserPayload) {
    return this.service.syncOne(user.townId);
  }
}
