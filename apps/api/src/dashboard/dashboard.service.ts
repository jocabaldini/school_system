import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ClassOccupancy {
  id: string;
  name: string;
  currentCount: number;
  maxCapacity: number;
}

interface RecentEnrollment {
  studentName: string;
  className: string;
  startDate: Date;
}

export interface DashboardSummary {
  activeStudentsCount: number;
  activeEmployeesCount: number;
  currentSchoolYear: number;
  currentYearClassesCount: number;
  activeEnrollmentsCount: number;
  classOccupancy: ClassOccupancy[];
  recentEnrollments: RecentEnrollment[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummary> {
    const [activeStudentsCount, activeEmployeesCount, activeEnrollmentsCount, latestClass] =
      await Promise.all([
        this.prisma.student.count({ where: { deletedAt: null } }),
        this.prisma.employee.count({ where: { deletedAt: null } }),
        this.prisma.enrollment.count({ where: { endDate: null } }),
        this.prisma.schoolClass.findFirst({
          where: { deletedAt: null },
          orderBy: { schoolYear: 'desc' },
          select: { schoolYear: true },
        }),
      ]);

    const currentSchoolYear = latestClass?.schoolYear ?? new Date().getFullYear();

    const [classes, recentEnrollments] = await Promise.all([
      this.prisma.schoolClass.findMany({
        where: { deletedAt: null, schoolYear: currentSchoolYear },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          maxCapacity: true,
          _count: { select: { enrollments: { where: { endDate: null } } } },
        },
      }),
      this.prisma.enrollment.findMany({
        orderBy: { startDate: 'desc' },
        take: 5,
        select: {
          startDate: true,
          student: { select: { name: true } },
          schoolClass: { select: { name: true } },
        },
      }),
    ]);

    return {
      activeStudentsCount,
      activeEmployeesCount,
      currentSchoolYear,
      currentYearClassesCount: classes.length,
      activeEnrollmentsCount,
      classOccupancy: classes.map((schoolClass) => ({
        id: schoolClass.id,
        name: schoolClass.name,
        currentCount: schoolClass._count.enrollments,
        maxCapacity: schoolClass.maxCapacity,
      })),
      recentEnrollments: recentEnrollments.map((enrollment) => ({
        studentName: enrollment.student.name,
        className: enrollment.schoolClass.name,
        startDate: enrollment.startDate,
      })),
    };
  }
}
