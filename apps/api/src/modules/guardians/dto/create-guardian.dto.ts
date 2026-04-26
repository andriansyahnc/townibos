import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGuardianDto {
  @ApiProperty()
  @IsNotEmpty() @IsString()
  studentId: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsNotEmpty() @IsString()
  name: string;

  @ApiProperty({ example: '08123456789' })
  @IsNotEmpty() @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Ayah' })
  @IsNotEmpty() @IsString()
  relationship: string;
}
