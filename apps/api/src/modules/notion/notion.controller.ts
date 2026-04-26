import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotionService } from './notion.service';

@ApiTags('notion')
@ApiBearerAuth()
@Controller('notion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotionController {
  constructor(private readonly service: NotionService) {}

  // Must be declared before /:townId to avoid route shadowing
  @Post('sync/me')
  @Roles('admin')
  @ApiOperation({ summary: 'Sync own town from Notion (admin)' })
  syncMine(@CurrentUser() user: CurrentUserPayload) {
    return this.service.syncOne(user.townId);
  }

  @Post('sync')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Sync all towns from Notion (superadmin)' })
  syncAll() {
    return this.service.syncAll();
  }

  @Post('sync/:townId')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Sync a specific town from Notion (superadmin)' })
  syncOne(@Param('townId') townId: string) {
    return this.service.syncOne(townId);
  }
}
