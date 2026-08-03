import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { EnrollmentsService } from './enrollments.service';
import { CalculateEnrollmentDto } from './dto/calculate-enrollment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('enrollments')
export class EnrollmentsCalculateController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post('calculate')
  calculate(@Body() dto: CalculateEnrollmentDto) {
    return this.enrollments.calculate(dto);
  }
}
