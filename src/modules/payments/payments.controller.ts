import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('residentId') residentId?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    if (residentId) filter.residentId = residentId;
    return this.service.findAll(filter);
  }

  @Get('overdue')
  findOverdue() {
    return this.service.findOverdue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/pay')
  markPaid(@Param('id') id: string) {
    return this.service.markPaid(id);
  }
}
