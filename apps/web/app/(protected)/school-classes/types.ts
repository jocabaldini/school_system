export type StatusFilter = 'ACTIVE' | 'INACTIVE';

export interface EmployeeOption {
  id: string;
  name: string;
}

export interface ClassEnrollment {
  id: string;
  startTime: string;
  endTime: string;
  startDate: string;
  student: { id: string; name: string };
}

export interface SchoolClass {
  id: string;
  name: string;
  schoolYear: number;
  maxCapacity: number;
  teacherId: string;
  teacher?: EmployeeOption;
  assistantId: string | null;
  assistant?: EmployeeOption | null;
  _count?: { enrollments: number };
  enrollments?: ClassEnrollment[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolClassListResult {
  data: SchoolClass[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSchoolClassPayload {
  name: string;
  schoolYear: number;
  maxCapacity: number;
  teacherId: string;
  assistantId?: string;
}

export interface UpdateSchoolClassPayload {
  name?: string;
  schoolYear?: number;
  maxCapacity?: number;
  teacherId?: string;
  assistantId?: string | null;
}
