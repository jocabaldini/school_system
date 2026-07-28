import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';

import { ResponsaveisService } from './responsaveis.service';
import { QueryResponsavelDto } from './dto/query-responsavel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('responsaveis')
export class ResponsaveisController {
  constructor(private readonly responsaveis: ResponsaveisService) {}

  @Get()
  findAll(@Query() query: QueryResponsavelDto) {
    return this.responsaveis.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @I18nLang() lang: string) {
    return this.responsaveis.findOne(id, lang);
  }
}
