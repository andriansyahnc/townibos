import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'changeme123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
