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

import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { QueryAlunoDto } from './dto/query-aluno.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('alunos')
export class AlunosController {
  constructor(private readonly alunos: AlunosService) {}

  @Post()
  create(@Body() dto: CreateAlunoDto, @I18nLang() lang: string) {
    return this.alunos.create(dto, lang);
  }

  @Get()
  findAll(@Query() query: QueryAlunoDto) {
    return this.alunos.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @I18nLang() lang: string) {
    return this.alunos.findOne(id, lang);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlunoDto, @I18nLang() lang: string) {
    return this.alunos.update(id, dto, lang);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @I18nLang() lang: string) {
    return this.alunos.remove(id, lang);
  }

  @Patch(':id/reativar')
  reactivate(@Param('id') id: string, @I18nLang() lang: string) {
    return this.alunos.reactivate(id, lang);
  }
}
