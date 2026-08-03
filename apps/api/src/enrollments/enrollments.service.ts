import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateEnrollmentDto } from './dto/calculate-enrollment.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { timeStringToDate } from './time.util';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private calculateDailyHours(input: {
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
  }): number {
    const startTime = timeStringToDate(input.startTime);
    const endTime = timeStringToDate(input.endTime);
    let minutes = (endTime.getTime() - startTime.getTime()) / 60000;

    if (input.breakStart && input.breakEnd) {
      const breakStart = timeStringToDate(input.breakStart);
      const breakEnd = timeStringToDate(input.breakEnd);
      minutes -= (breakEnd.getTime() - breakStart.getTime()) / 60000;
    }

    return minutes / 60;
  }

  async calculate(dto: CalculateEnrollmentDto) {
    const settings = await this.prisma.settings.findFirst();
    if (!settings) {
      throw new InternalServerErrorException('Settings row is missing');
    }

    const dailyHours = this.calculateDailyHours(dto);
    const discount = dto.discountPercentage ?? 0;
    const suggestedAmount =
      dailyHours *
      Number(settings.pricePerHour) *
      settings.defaultSchoolDays *
      (1 - discount / 100);

    return { dailyHours, suggestedAmount };
  }

  private async ensureStudentExists(studentId: string, lang: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(this.i18n.t('enrollments.student_not_found', { lang }));
    }
  }

  private async findOwned(studentId: string, id: string, lang: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment || enrollment.studentId !== studentId) {
      throw new NotFoundException(this.i18n.t('enrollments.not_found', { lang }));
    }
    return enrollment;
  }

  async create(studentId: string, dto: CreateEnrollmentDto, lang: string) {
    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({ where: { id: studentId } });
      if (!student) {
        throw new NotFoundException(this.i18n.t('enrollments.student_not_found', { lang }));
      }

      const schoolClass = await tx.schoolClass.findUnique({ where: { id: dto.schoolClassId } });
      if (!schoolClass || schoolClass.deletedAt) {
        throw new NotFoundException(this.i18n.t('enrollments.school_class_not_found', { lang }));
      }

      const activeEnrollments = await tx.enrollment.count({
        where: { schoolClassId: dto.schoolClassId, endDate: null },
      });
      if (activeEnrollments >= schoolClass.maxCapacity) {
        throw new ConflictException(this.i18n.t('enrollments.school_class_full', { lang }));
      }

      const startDate = new Date(dto.startDate);

      const activeEnrollment = await tx.enrollment.findFirst({
        where: { studentId, endDate: null },
      });
      if (activeEnrollment) {
        const previousEndDate = new Date(startDate);
        previousEndDate.setUTCDate(previousEndDate.getUTCDate() - 1);
        await tx.enrollment.update({
          where: { id: activeEnrollment.id },
          data: { endDate: previousEndDate },
        });
      }

      return tx.enrollment.create({
        data: {
          studentId,
          schoolClassId: dto.schoolClassId,
          startTime: timeStringToDate(dto.startTime),
          endTime: timeStringToDate(dto.endTime),
          breakStart: dto.breakStart ? timeStringToDate(dto.breakStart) : undefined,
          breakEnd: dto.breakEnd ? timeStringToDate(dto.breakEnd) : undefined,
          discountPercentage: dto.discountPercentage ?? 0,
          tuitionAmount: dto.tuitionAmount,
          startDate,
        },
      });
    });
  }

  async findAll(studentId: string, lang: string) {
    await this.ensureStudentExists(studentId, lang);

    return this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(studentId: string, id: string, dto: UpdateEnrollmentDto, lang: string) {
    await this.findOwned(studentId, id, lang);

    if (dto.schoolClassId) {
      const schoolClass = await this.prisma.schoolClass.findUnique({
        where: { id: dto.schoolClassId },
      });
      if (!schoolClass || schoolClass.deletedAt) {
        throw new NotFoundException(this.i18n.t('enrollments.school_class_not_found', { lang }));
      }
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        schoolClassId: dto.schoolClassId,
        startTime: dto.startTime ? timeStringToDate(dto.startTime) : undefined,
        endTime: dto.endTime ? timeStringToDate(dto.endTime) : undefined,
        breakStart: dto.breakStart ? timeStringToDate(dto.breakStart) : undefined,
        breakEnd: dto.breakEnd ? timeStringToDate(dto.breakEnd) : undefined,
        discountPercentage: dto.discountPercentage,
        tuitionAmount: dto.tuitionAmount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate === null ? null : dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }
}
