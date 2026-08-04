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

import { SchoolClassesService } from './school-classes.service';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { UpdateSchoolClassDto } from './dto/update-school-class.dto';
import { QuerySchoolClassDto } from './dto/query-school-class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('school-classes')
export class SchoolClassesController {
  constructor(private readonly schoolClasses: SchoolClassesService) {}

  @Post()
  create(@Body() dto: CreateSchoolClassDto, @I18nLang() lang: string) {
    return this.schoolClasses.create(dto, lang);
  }

  @Get()
  findAll(@Query() query: QuerySchoolClassDto) {
    return this.schoolClasses.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @I18nLang() lang: string) {
    return this.schoolClasses.findOne(id, lang);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSchoolClassDto, @I18nLang() lang: string) {
    return this.schoolClasses.update(id, dto, lang);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @I18nLang() lang: string) {
    return this.schoolClasses.remove(id, lang);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @I18nLang() lang: string) {
    return this.schoolClasses.reactivate(id, lang);
  }
}
