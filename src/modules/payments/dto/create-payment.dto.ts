import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: '64b1f...', description: 'Resident ObjectId' })
  @IsNotEmpty()
  @IsString()
  residentId: string;

  @ApiProperty({ example: '64b1f...', description: 'Unit ObjectId' })
  @IsNotEmpty()
  @IsString()
  unitId: string;

  @ApiProperty({ example: 200000, description: 'Amount in IDR' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ enum: ['iuran', 'listrik', 'air', 'parkir', 'lainnya'], default: 'iuran' })
  @IsOptional()
  @IsEnum(['iuran', 'listrik', 'air', 'parkir', 'lainnya'])
  type?: string;

  @ApiProperty({ example: '2026-04', description: 'Billing period in YYYY-MM format' })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'period must be in YYYY-MM format' })
  period: string;

  @ApiPropertyOptional({ example: 'Terlambat 3 hari' })
  @IsOptional()
  @IsString()
  notes?: string;
}
