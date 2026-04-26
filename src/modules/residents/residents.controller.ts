import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateResidentDto } from './dto/create-resident.dto';
import { ResidentsService } from './residents.service';

@ApiTags('residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class ResidentsController {
  constructor(private readonly service: ResidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a resident' })
  create(@Body() dto: CreateResidentDto, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === 'admin') dto = { ...dto, townId: user.townId } as any;
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List residents' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(user.role === 'admin' ? user.townId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resident by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resident' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateResidentDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resident' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
