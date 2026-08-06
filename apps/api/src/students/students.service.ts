import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreateStudentDto, lang: string) {
    if (dto.guardianId && dto.guardian) {
      throw new BadRequestException(this.i18n.t('students.guardian_xor', { lang }));
    }

    return this.prisma.$transaction(async (tx) => {
      let guardianId: string;

      if (dto.guardian) {
        const existing = await tx.guardian.findUnique({
          where: { cpf: dto.guardian.cpf.replace(/\D/g, '') },
        });

        if (existing) {
          guardianId = existing.id;
        } else {
          const created = await tx.guardian.create({
            data: {
              name: dto.guardian.name,
              cpf: dto.guardian.cpf.replace(/\D/g, ''),
              phone: dto.guardian.phone,
              email: dto.guardian.email,
            },
          });
          guardianId = created.id;
        }
      } else {
        const guardian = await tx.guardian.findUnique({
          where: { id: dto.guardianId },
        });
        if (!guardian) {
          throw new NotFoundException(this.i18n.t('students.guardian_not_found', { lang }));
        }
        guardianId = guardian.id;
      }

      return tx.student.create({
        data: {
          name: dto.name,
          birthDate: new Date(dto.birthDate),
          photoUrl: dto.photoUrl,
          guardianId,
        },
        include: { guardian: true },
      });
    });
  }

  async findAll(query: QueryStudentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where =
      query.status === 'ACTIVE'
        ? { deletedAt: null }
        : query.status === 'INACTIVE'
          ? { deletedAt: { not: null } }
          : {};

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          guardian: true,
          enrollments: { where: { endDate: null }, include: { schoolClass: true } },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, lang: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { guardian: true, authorizedPickups: true },
    });

    if (!student) {
      throw new NotFoundException(this.i18n.t('students.not_found', { lang }));
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto, lang: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('students.not_found', { lang }));
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        name: dto.name,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        photoUrl: dto.photoUrl,
      },
    });
  }

  async remove(id: string, lang: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('students.not_found', { lang }));
    }

    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reactivate(id: string, lang: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('students.not_found', { lang }));
    }

    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
