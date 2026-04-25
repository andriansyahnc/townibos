import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';

@Controller('residents')
export class ResidentsController {
  constructor(private readonly service: ResidentsService) {}

  @Post()
  create(@Body() dto: CreateResidentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateResidentDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
