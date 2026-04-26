import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin-griya' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'strongpassword' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ enum: ['superadmin', 'admin'] })
  @IsEnum(['superadmin', 'admin'])
  role: string;

  @ApiPropertyOptional({ example: '64b1f...', description: 'Required when role is admin' })
  @IsOptional()
  @IsString()
  townId?: string;
}
