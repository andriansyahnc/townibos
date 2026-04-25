import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RegulationsService } from './regulations.service';

@Controller('regulations')
export class RegulationsController {
  constructor(private readonly service: RegulationsService) {}

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('category') category?: string) {
    return this.service.findAll(category);
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
