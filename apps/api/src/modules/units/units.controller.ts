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
import { CreateUnitDto } from './dto/create-unit.dto';
import { UnitsService } from './units.service';

@ApiTags('units')
@ApiBearerAuth()
@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a unit' })
  create(@Body() dto: CreateUnitDto, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === 'admin') (dto as any).townId = user.townId;
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List units' })
  @ApiQuery({ name: 'status', required: false, enum: ['occupied', 'vacant', 'maintenance'] })
  findAll(@CurrentUser() user: CurrentUserPayload, @Query('status') status?: string) {
    const filter: any = {};
    if (user.role === 'admin') filter.townId = user.townId;
    if (status) filter.status = status;
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a unit by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a unit' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateUnitDto>,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user.role === 'admin' ? user.townId : undefined);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a unit' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user.role === 'admin' ? user.townId : undefined);
  }
}
