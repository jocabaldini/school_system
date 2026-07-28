import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';

import { AutorizadosBuscaService } from './autorizados-busca.service';
import { CreateAutorizadoBuscaDto } from './dto/create-autorizado-busca.dto';
import { UpdateAutorizadoBuscaDto } from './dto/update-autorizado-busca.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('alunos/:alunoId/autorizados-busca')
export class AutorizadosBuscaController {
  constructor(private readonly autorizadosBusca: AutorizadosBuscaService) {}

  @Post()
  create(
    @Param('alunoId') alunoId: string,
    @Body() dto: CreateAutorizadoBuscaDto,
    @I18nLang() lang: string,
  ) {
    return this.autorizadosBusca.create(alunoId, dto, lang);
  }

  @Get()
  findAll(@Param('alunoId') alunoId: string, @I18nLang() lang: string) {
    return this.autorizadosBusca.findAll(alunoId, lang);
  }

  @Patch(':autorizadoId')
  update(
    @Param('alunoId') alunoId: string,
    @Param('autorizadoId') autorizadoId: string,
    @Body() dto: UpdateAutorizadoBuscaDto,
    @I18nLang() lang: string,
  ) {
    return this.autorizadosBusca.update(alunoId, autorizadoId, dto, lang);
  }

  @Delete(':autorizadoId')
  remove(
    @Param('alunoId') alunoId: string,
    @Param('autorizadoId') autorizadoId: string,
    @I18nLang() lang: string,
  ) {
    return this.autorizadosBusca.remove(alunoId, autorizadoId, lang);
  }
}
