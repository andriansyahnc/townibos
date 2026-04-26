import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Kerja Bakti Minggu Ini' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Kerja bakti dilaksanakan pada Minggu, 27 April pukul 07.00 WIB.' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({
    enum: ['general', 'maintenance', 'payment', 'emergency'],
    default: 'general',
  })
  @IsOptional()
  @IsEnum(['general', 'maintenance', 'payment', 'emergency'])
  category?: string;

  @ApiPropertyOptional({ default: false, description: 'Push to Telegram when true' })
  @IsOptional()
  @IsBoolean()
  broadcastTelegram?: boolean;

  @ApiPropertyOptional({ example: '2026-04-27T07:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
