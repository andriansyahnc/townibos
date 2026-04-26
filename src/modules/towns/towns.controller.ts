import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TownsService } from './towns.service';

@Controller('towns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class TownsController {
  constructor(private readonly service: TownsService) {}

  @Post()
  async create(@Body() dto: any) {
    return this.mask(await this.service.create(dto));
  }

  @Get()
  async findAll() {
    return (await this.service.findAll()).map((t) => this.mask(t));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.mask(await this.service.findOne(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.mask(await this.service.update(id, dto));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  private mask(town: any) {
    if (!town) return town;
    const obj = town.toObject ? town.toObject() : { ...town };
    if (obj.notionApiKey) obj.notionApiKey = 'secret_****';
    return obj;
  }
}
