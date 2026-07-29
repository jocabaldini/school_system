import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';

import { FuncionariosService } from './funcionarios.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { QueryFuncionarioDto } from './dto/query-funcionario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly funcionarios: FuncionariosService) {}

  @Post()
  create(@Body() dto: CreateFuncionarioDto, @I18nLang() lang: string) {
    return this.funcionarios.create(dto, lang);
  }

  @Get()
  findAll(@Query() query: QueryFuncionarioDto) {
    return this.funcionarios.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @I18nLang() lang: string) {
    return this.funcionarios.findOne(id, lang);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFuncionarioDto, @I18nLang() lang: string) {
    return this.funcionarios.update(id, dto, lang);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @I18nLang() lang: string) {
    return this.funcionarios.remove(id, lang);
  }

  @Patch(':id/reativar')
  reactivate(@Param('id') id: string, @I18nLang() lang: string) {
    return this.funcionarios.reactivate(id, lang);
  }
}
