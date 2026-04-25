import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status ? { status } : {});
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
