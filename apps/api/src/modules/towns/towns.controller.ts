import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTownDto } from './dto/create-town.dto';
import { UpdateNotionCredentialsDto } from './dto/update-notion-credentials.dto';
import { TownsService } from './towns.service';

@ApiTags('towns')
@ApiBearerAuth()
@Controller('towns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class TownsController {
  constructor(private readonly service: TownsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a town (superadmin)' })
  async create(@Body() dto: CreateTownDto) {
    return this.mask(await this.service.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'List all towns (superadmin)' })
  async findAll() {
    return (await this.service.findAll()).map((t) => this.mask(t));
  }

  @Patch('me/notion')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: "Update own town's Notion credentials (admin)" })
  async updateMyNotion(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateNotionCredentialsDto,
  ) {
    if (!user.townId) throw new BadRequestException('No town associated with this account');
    return this.mask(await this.service.update(user.townId, dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a town by id (superadmin)' })
  async findOne(@Param('id') id: string) {
    return this.mask(await this.service.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a town (superadmin)' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTownDto>) {
    return this.mask(await this.service.update(id, dto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a town (superadmin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  private mask(town: any) {
    if (!town) return town;
    const obj = town.toObject ? town.toObject() : { ...town };
    if (obj.notionApiKey) obj.notionApiKey = 'secret_****';
    return obj;
  }
}
