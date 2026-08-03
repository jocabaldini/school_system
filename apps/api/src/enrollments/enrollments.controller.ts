import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';

import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('students/:studentId/enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post()
  create(
    @Param('studentId') studentId: string,
    @Body() dto: CreateEnrollmentDto,
    @I18nLang() lang: string,
  ) {
    return this.enrollments.create(studentId, dto, lang);
  }

  @Get()
  findAll(@Param('studentId') studentId: string, @I18nLang() lang: string) {
    return this.enrollments.findAll(studentId, lang);
  }

  @Patch(':enrollmentId')
  update(
    @Param('studentId') studentId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: UpdateEnrollmentDto,
    @I18nLang() lang: string,
  ) {
    return this.enrollments.update(studentId, enrollmentId, dto, lang);
  }
}
