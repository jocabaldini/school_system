import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorizedPickupDto } from './dto/create-authorized-pickup.dto';
import { UpdateAuthorizedPickupDto } from './dto/update-authorized-pickup.dto';

@Injectable()
export class AuthorizedPickupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private async ensureStudentExists(studentId: string, lang: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(this.i18n.t('students.not_found', { lang }));
    }
  }

  private async findOwned(studentId: string, id: string, lang: string) {
    const pickup = await this.prisma.authorizedPickup.findUnique({ where: { id } });
    if (!pickup || pickup.studentId !== studentId) {
      throw new NotFoundException(this.i18n.t('students.authorized_pickup_not_found', { lang }));
    }
    return pickup;
  }

  async create(studentId: string, dto: CreateAuthorizedPickupDto, lang: string) {
    await this.ensureStudentExists(studentId, lang);

    return this.prisma.authorizedPickup.create({
      data: {
        name: dto.name,
        relationship: dto.relationship,
        phone: dto.phone,
        studentId,
      },
    });
  }

  async findAll(studentId: string, lang: string) {
    await this.ensureStudentExists(studentId, lang);

    return this.prisma.authorizedPickup.findMany({ where: { studentId } });
  }

  async update(studentId: string, id: string, dto: UpdateAuthorizedPickupDto, lang: string) {
    await this.findOwned(studentId, id, lang);

    return this.prisma.authorizedPickup.update({
      where: { id },
      data: {
        name: dto.name,
        relationship: dto.relationship,
        phone: dto.phone,
      },
    });
  }

  async remove(studentId: string, id: string, lang: string) {
    await this.findOwned(studentId, id, lang);

    await this.prisma.authorizedPickup.delete({ where: { id } });
    return { ok: true };
  }
}
