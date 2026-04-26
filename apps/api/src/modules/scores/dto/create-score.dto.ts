import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateScoreDto {
  @ApiProperty()
  @IsNotEmpty() @IsString()
  residentId: string;

  @ApiProperty({ example: 'Matematika' })
  @IsNotEmpty() @IsString()
  subject: string;

  @ApiProperty({ example: '2025-1' })
  @IsNotEmpty() @IsString()
  period: string;

  @ApiProperty({ example: 85 })
  @IsNumber() @Min(0) @Max(100)
  score: number;

  @ApiPropertyOptional({ enum: ['daily', 'mid', 'final'], default: 'daily' })
  @IsOptional()
  @IsIn(['daily', 'mid', 'final'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}
