import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';

import { GuardiansService } from './guardians.service';
import { QueryGuardianDto } from './dto/query-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardians: GuardiansService) {}

  @Get()
  findAll(@Query() query: QueryGuardianDto) {
    return this.guardians.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @I18nLang() lang: string) {
    return this.guardians.findOne(id, lang);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGuardianDto, @I18nLang() lang: string) {
    return this.guardians.update(id, dto, lang);
  }
}
