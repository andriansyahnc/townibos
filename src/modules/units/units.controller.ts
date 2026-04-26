import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UnitsService } from './units.service';

@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Post()
  create(@Body() dto: any, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === 'admin') dto = { ...dto, townId: user.townId };
    return this.service.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload, @Query('status') status?: string) {
    const filter: any = {};
    if (user.role === 'admin') filter.townId = user.townId;
    if (status) filter.status = status;
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
