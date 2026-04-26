import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateNotionCredentialsDto {
  @ApiPropertyOptional({
    example: 'secret_abc123...',
    description: 'Notion internal integration token',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notionApiKey?: string;

  @ApiPropertyOptional({ example: '712341dc83fa4ecca8b8fa27913d4f31' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notionDatabaseId?: string;
}
