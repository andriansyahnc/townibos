import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: '01' })
  @IsNotEmpty()
  @IsString()
  number: string;

  @ApiProperty({ example: 'A' })
  @IsNotEmpty()
  @IsString()
  block: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  floor: number;

  @ApiProperty({ example: '2BR', description: 'Unit type label, e.g. 1BR, 2BR, Studio' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiPropertyOptional({ enum: ['occupied', 'vacant', 'maintenance'], default: 'vacant' })
  @IsOptional()
  @IsEnum(['occupied', 'vacant', 'maintenance'])
  status?: string;

  @ApiPropertyOptional({ example: 36, description: 'Floor area in m²' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  area?: number;
}
