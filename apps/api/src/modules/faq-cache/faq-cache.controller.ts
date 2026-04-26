import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FaqCacheService } from './faq-cache.service';

@ApiTags('faq-cache')
@ApiBearerAuth()
@Controller('faq-cache')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class FaqCacheController {
  constructor(private readonly service: FaqCacheService) {}

  @Get()
  @ApiOperation({ summary: 'List cached FAQ entries' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(user.role === 'admin' ? user.townId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cached FAQ entry' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit the answer of a cached FAQ entry' })
  update(
    @Param('id') id: string,
    @Body() dto: { answer: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user.role === 'admin' ? user.townId : undefined);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cached FAQ entry' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user.role === 'admin' ? user.townId : undefined);
  }
}
