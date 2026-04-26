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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RegulationsService } from './regulations.service';

@ApiTags('regulations')
@ApiBearerAuth()
@Controller('regulations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class RegulationsController {
  constructor(private readonly service: RegulationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a regulation' })
  create(@Body() dto: any, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === 'admin') dto = { ...dto, townId: user.townId };
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List regulations' })
  @ApiQuery({ name: 'category', required: false })
  findAll(@CurrentUser() user: CurrentUserPayload, @Query('category') category?: string) {
    return this.service.findAll(user.role === 'admin' ? user.townId : undefined, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a regulation by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a regulation' })
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: CurrentUserPayload) {
    return this.service.update(id, dto, user.role === 'admin' ? user.townId : undefined);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a regulation' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user.role === 'admin' ? user.townId : undefined);
  }
}
