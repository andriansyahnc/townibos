import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequiresModule } from '../../common/decorators/require-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateScoreDto } from './dto/create-score.dto';
import { ScoresService } from './scores.service';

@ApiTags('scores')
@ApiBearerAuth()
@Controller('scores')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleGuard)
@Roles('superadmin', 'admin')
@RequiresModule('scores')
export class ScoresController {
  constructor(private readonly service: ScoresService) {}

  @Post()
  @ApiOperation({ summary: 'Create a score record' })
  create(@Body() dto: CreateScoreDto, @CurrentUser() user: CurrentUserPayload) {
    const townId = user.role === 'admin' ? user.townId : (dto as any).townId;
    return this.service.create({ ...dto, townId });
  }

  @Get()
  @ApiOperation({ summary: 'List scores' })
  findAll(@CurrentUser() user: CurrentUserPayload, @Query('residentId') residentId?: string) {
    return this.service.findAll(user.role === 'admin' ? user.townId : undefined, residentId);
  }

  @Get('resident/:residentId')
  @ApiOperation({ summary: 'Get all scores for a resident' })
  getByResident(@Param('residentId') residentId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.getByResident(residentId, user.role === 'admin' ? user.townId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a score by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a score' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateScoreDto>,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user.role === 'admin' ? user.townId : undefined);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a score' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user.role === 'admin' ? user.townId : undefined);
  }
}
