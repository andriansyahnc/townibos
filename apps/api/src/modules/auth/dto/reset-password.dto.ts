import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'superadmin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'new-strong-password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
