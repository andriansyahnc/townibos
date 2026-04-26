import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequiresModule } from '../../common/decorators/require-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { GuardiansService } from './guardians.service';

@ApiTags('guardians')
@ApiBearerAuth()
@Controller('guardians')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleGuard)
@Roles('superadmin', 'admin')
@RequiresModule('guardians')
export class GuardiansController {
  constructor(private readonly service: GuardiansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a guardian record' })
  create(@Body() dto: CreateGuardianDto, @CurrentUser() user: CurrentUserPayload) {
    const townId = user.role === 'admin' ? user.townId : (dto as any).townId;
    return this.service.create({ ...dto, townId });
  }

  @Get()
  @ApiOperation({ summary: 'List guardians' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(user.role === 'admin' ? user.townId : undefined);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get guardians for a student' })
  getByStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.getByStudent(studentId, user.role === 'admin' ? user.townId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a guardian by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a guardian' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateGuardianDto>,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user.role === 'admin' ? user.townId : undefined);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a guardian' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user.role === 'admin' ? user.townId : undefined);
  }
}
