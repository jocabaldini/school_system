import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';

import { AuthorizedPickupsService } from './authorized-pickups.service';
import { CreateAuthorizedPickupDto } from './dto/create-authorized-pickup.dto';
import { UpdateAuthorizedPickupDto } from './dto/update-authorized-pickup.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('students/:studentId/authorized-pickups')
export class AuthorizedPickupsController {
  constructor(private readonly authorizedPickups: AuthorizedPickupsService) {}

  @Post()
  create(
    @Param('studentId') studentId: string,
    @Body() dto: CreateAuthorizedPickupDto,
    @I18nLang() lang: string,
  ) {
    return this.authorizedPickups.create(studentId, dto, lang);
  }

  @Get()
  findAll(@Param('studentId') studentId: string, @I18nLang() lang: string) {
    return this.authorizedPickups.findAll(studentId, lang);
  }

  @Patch(':pickupId')
  update(
    @Param('studentId') studentId: string,
    @Param('pickupId') pickupId: string,
    @Body() dto: UpdateAuthorizedPickupDto,
    @I18nLang() lang: string,
  ) {
    return this.authorizedPickups.update(studentId, pickupId, dto, lang);
  }

  @Delete(':pickupId')
  remove(
    @Param('studentId') studentId: string,
    @Param('pickupId') pickupId: string,
    @I18nLang() lang: string,
  ) {
    return this.authorizedPickups.remove(studentId, pickupId, lang);
  }
}
