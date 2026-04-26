import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTownDto {
  @ApiProperty({ example: 'Perumahan Griya Indah' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'griya-indah', description: 'URL-friendly unique identifier' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'secret_abc123...',
    description: 'Notion internal integration token — encrypted at rest',
  })
  @IsNotEmpty()
  @IsString()
  notionApiKey: string;

  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  @IsNotEmpty()
  @IsString()
  notionDatabaseId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ObjectId of a DomainTemplate' })
  @IsOptional()
  @IsString()
  domainTemplateId?: string;
}
