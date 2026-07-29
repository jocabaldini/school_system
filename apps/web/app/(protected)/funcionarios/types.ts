export type StatusFilter = 'ATIVO' | 'INATIVO';

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FuncionarioListResult {
  data: Funcionario[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateFuncionarioPayload {
  nome: string;
  cargo: string;
  cpf?: string;
  telefone?: string;
  email?: string;
}

export interface UpdateFuncionarioPayload {
  nome?: string;
  cargo?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
}

// createFuncionario/updateFuncionario return this instead of throwing on failure — a server
// action's thrown Error loses its class/status once it crosses back to the client (see
// alunos/actions.ts's updateResponsavel for the same pattern), and the form needs the status to
// show a cpf conflict inline rather than as a generic toast.
export type FuncionarioResult =
  { ok: true; data: Funcionario } | { ok: false; status: number; message: string };
