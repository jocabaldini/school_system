export type StatusFilter = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: string;
  name: string;
  position: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListResult {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEmployeePayload {
  name: string;
  position: string;
  cpf?: string;
  phone?: string;
  email?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  position?: string;
  cpf?: string;
  phone?: string;
  email?: string;
}

// createEmployee/updateEmployee return this instead of throwing on failure — a server
// action's thrown Error loses its class/status once it crosses back to the client (see
// students/actions.ts's updateGuardian for the same pattern), and the form needs the status to
// show a cpf conflict inline rather than as a generic toast.
export type EmployeeResult =
  { ok: true; data: Employee } | { ok: false; status: number; message: string };
