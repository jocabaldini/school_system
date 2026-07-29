export type StatusAluno = 'ATIVO' | 'INATIVO';

export interface Responsavel {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutorizadoBusca {
  id: string;
  nome: string;
  parentesco: string;
  telefone: string | null;
  alunoId: string;
}

export interface Aluno {
  id: string;
  nome: string;
  dataNascimento: string;
  fotoUrl: string | null;
  status: StatusAluno;
  responsavelId: string;
  responsavel?: Responsavel;
  autorizadosBusca?: AutorizadoBusca[];
  createdAt: string;
  updatedAt: string;
}

export interface AlunoListResult {
  data: Aluno[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateResponsavelInlinePayload {
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
}

export interface CreateAlunoPayload {
  nome: string;
  dataNascimento: string;
  fotoUrl?: string;
  responsavelId?: string;
  responsavel?: CreateResponsavelInlinePayload;
}

export interface UpdateAlunoPayload {
  nome?: string;
  dataNascimento?: string;
  fotoUrl?: string;
  status?: StatusAluno;
}

export interface AutorizadoPayload {
  nome: string;
  parentesco: string;
  telefone?: string;
}

export interface UpdateResponsavelPayload {
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
}

export type UpdateResponsavelResult =
  | { ok: true; data: Responsavel }
  | { ok: false; status: number; message: string };
