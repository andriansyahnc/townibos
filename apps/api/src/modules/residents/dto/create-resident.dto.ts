import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResidentDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'budi@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '081234567890' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '64b1f...', description: 'Unit ObjectId' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ enum: ['owner', 'tenant'], default: 'tenant' })
  @IsOptional()
  @IsEnum(['owner', 'tenant'])
  role?: string;

  townId?: string;
}
