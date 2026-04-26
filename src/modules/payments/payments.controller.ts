import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  create(@Body() dto: any, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === 'admin') dto = { ...dto, townId: user.townId };
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('residentId') residentId?: string,
  ) {
    const filter: any = {};
    if (user.role === 'admin') filter.townId = user.townId;
    if (status) filter.status = status;
    if (residentId) filter.residentId = residentId;
    return this.service.findAll(filter);
  }

  @Get('overdue')
  findOverdue(@CurrentUser() user: CurrentUserPayload) {
    const filter: any = { status: 'overdue' };
    if (user.role === 'admin') filter.townId = user.townId;
    return this.service.findAll(filter);
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
