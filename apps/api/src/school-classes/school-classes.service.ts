import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { UpdateSchoolClassDto } from './dto/update-school-class.dto';
import { QuerySchoolClassDto } from './dto/query-school-class.dto';

@Injectable()
export class SchoolClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private buildWhere(query: QuerySchoolClassDto): Prisma.SchoolClassWhereInput {
    const where: Prisma.SchoolClassWhereInput = {};

    if (query.status === 'INACTIVE') where.deletedAt = { not: null };
    else if (query.status !== 'ALL') where.deletedAt = null;

    if (query.schoolYear !== undefined) where.schoolYear = query.schoolYear;
    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };

    return where;
  }

  private async ensureTeacherActive(teacherId: string, lang: string) {
    const teacher = await this.prisma.employee.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException(this.i18n.t('schoolClasses.teacher_not_found', { lang }));
    }
  }

  private async ensureAssistantActive(assistantId: string, lang: string) {
    const assistant = await this.prisma.employee.findUnique({ where: { id: assistantId } });
    if (!assistant || assistant.deletedAt) {
      throw new NotFoundException(this.i18n.t('schoolClasses.assistant_not_found', { lang }));
    }
  }

  private async ensureNameSchoolYearUnique(
    name: string,
    schoolYear: number,
    lang: string,
    ignoreId?: string,
  ) {
    const existing = await this.prisma.schoolClass.findUnique({
      where: { name_schoolYear: { name, schoolYear } },
    });
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException(this.i18n.t('schoolClasses.duplicate', { lang }));
    }
  }

  async create(dto: CreateSchoolClassDto, lang: string) {
    await this.ensureTeacherActive(dto.teacherId, lang);
    if (dto.assistantId) {
      await this.ensureAssistantActive(dto.assistantId, lang);
    }
    await this.ensureNameSchoolYearUnique(dto.name, dto.schoolYear, lang);

    try {
      return await this.prisma.schoolClass.create({
        data: {
          name: dto.name,
          schoolYear: dto.schoolYear,
          maxCapacity: dto.maxCapacity,
          teacherId: dto.teacherId,
          assistantId: dto.assistantId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(this.i18n.t('schoolClasses.duplicate', { lang }));
      }
      throw err;
    }
  }

  async findAll(query: QuerySchoolClassDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.schoolClass.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: true,
          assistant: true,
          _count: { select: { enrollments: { where: { endDate: null } } } },
        },
      }),
      this.prisma.schoolClass.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, lang: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
      include: {
        teacher: true,
        assistant: true,
        _count: { select: { enrollments: { where: { endDate: null } } } },
      },
    });
    if (!schoolClass) {
      throw new NotFoundException(this.i18n.t('schoolClasses.not_found', { lang }));
    }
    return schoolClass;
  }

  async update(id: string, dto: UpdateSchoolClassDto, lang: string) {
    const existing = await this.findOne(id, lang);

    if (dto.teacherId) {
      await this.ensureTeacherActive(dto.teacherId, lang);
    }
    if (dto.assistantId) {
      await this.ensureAssistantActive(dto.assistantId, lang);
    }

    const name = dto.name ?? existing.name;
    const schoolYear = dto.schoolYear ?? existing.schoolYear;
    if (name !== existing.name || schoolYear !== existing.schoolYear) {
      await this.ensureNameSchoolYearUnique(name, schoolYear, lang, id);
    }

    try {
      return await this.prisma.schoolClass.update({
        where: { id },
        data: {
          name: dto.name,
          schoolYear: dto.schoolYear,
          maxCapacity: dto.maxCapacity,
          teacherId: dto.teacherId,
          assistantId: dto.assistantId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(this.i18n.t('schoolClasses.duplicate', { lang }));
      }
      throw err;
    }
  }

  async remove(id: string, lang: string) {
    await this.findOne(id, lang);

    return this.prisma.schoolClass.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reactivate(id: string, lang: string) {
    await this.findOne(id, lang);

    return this.prisma.schoolClass.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
