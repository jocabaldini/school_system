export interface ClassOccupancy {
  id: string;
  name: string;
  currentCount: number;
  maxCapacity: number;
}

export interface RecentEnrollment {
  studentName: string;
  className: string;
  startDate: string;
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
