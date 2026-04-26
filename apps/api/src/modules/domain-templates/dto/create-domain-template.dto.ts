import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MODULE_SLUGS } from '../../../common/modules/module.registry';

export class CreateDomainTemplateDto {
  @ApiProperty({ example: 'Sekolah' })
  @IsNotEmpty() @IsString()
  name: string;

  @ApiProperty({ example: 'sekolah' })
  @IsNotEmpty() @IsString()
  slug: string;

  @ApiProperty({ example: 'Siswa' })
  @IsNotEmpty() @IsString()
  memberLabel: string;

  @ApiProperty({ example: 'Kelas' })
  @IsNotEmpty() @IsString()
  assetLabel: string;

  @ApiProperty({ example: 'Peraturan Sekolah' })
  @IsNotEmpty() @IsString()
  documentLabel: string;

  @ApiProperty({ example: 'asisten informasi sekolah' })
  @IsNotEmpty() @IsString()
  ragRole: string;

  @ApiProperty({ example: 'Portal Siswa' })
  @IsNotEmpty() @IsString()
  portalTitle: string;

  @ApiPropertyOptional({ example: ['residents', 'announcements', 'scores', 'guardians'] })
  @IsOptional()
  @IsArray()
  @IsIn(MODULE_SLUGS, { each: true })
  enabledModules?: string[];
}
