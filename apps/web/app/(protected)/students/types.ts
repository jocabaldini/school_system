export type StatusFilter = 'ACTIVE' | 'INACTIVE';

export interface Guardian {
  id: string;
  name: string;
  cpf: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizedPickup {
  id: string;
  name: string;
  relationship: string;
  phone: string | null;
  studentId: string;
}

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  photoUrl: string | null;
  deletedAt: string | null;
  guardianId: string;
  guardian?: Guardian;
  authorizedPickups?: AuthorizedPickup[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentListResult {
  data: Student[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateGuardianInlinePayload {
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
}

export interface CreateStudentPayload {
  name: string;
  birthDate: string;
  photoUrl?: string;
  guardianId?: string;
  guardian?: CreateGuardianInlinePayload;
}

export interface UpdateStudentPayload {
  name?: string;
  birthDate?: string;
  photoUrl?: string;
}

export interface AuthorizedPickupPayload {
  name: string;
  relationship: string;
  phone?: string;
}

export interface UpdateGuardianPayload {
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string;
}

export type UpdateGuardianResult =
  { ok: true; data: Guardian } | { ok: false; status: number; message: string };
