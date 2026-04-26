import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment record' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === 'admin') (dto as any).townId = user.townId;
    return this.service.create(dto as any);
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'paid', 'overdue'] })
  @ApiQuery({ name: 'residentId', required: false })
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
  @ApiOperation({ summary: 'List overdue payments' })
  findOverdue(@CurrentUser() user: CurrentUserPayload) {
    const filter: any = { status: 'overdue' };
    if (user.role === 'admin') filter.townId = user.townId;
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark a payment as paid' })
  markPaid(@Param('id') id: string) {
    return this.service.markPaid(id);
  }
}
