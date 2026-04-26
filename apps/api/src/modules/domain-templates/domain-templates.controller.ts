import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MODULE_REGISTRY } from '../../common/modules/module.registry';
import { DomainTemplatesService } from './domain-templates.service';
import { CreateDomainTemplateDto } from './dto/create-domain-template.dto';

@ApiTags('domain-templates')
@Controller('domain-templates')
export class DomainTemplatesController {
  constructor(private readonly service: DomainTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all domain templates (public)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('registry')
  @ApiOperation({ summary: 'List all available module slugs' })
  registry() {
    return MODULE_REGISTRY;
  }

  @Post()
  @ApiOperation({ summary: 'Create a domain template' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  create(@Body() dto: CreateDomainTemplateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a domain template' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  update(@Param('id') id: string, @Body() dto: Partial<CreateDomainTemplateDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a domain template' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
