export const NEST_ROUTES = {
  health: '/health',

  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },

  users: {
    list: '/users',
    create: '/users',
    findOne: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    remove: (id: string) => `/users/${id}`,
  },

  alunos: {
    list: '/alunos',
    create: '/alunos',
    findOne: (id: string) => `/alunos/${id}`,
    update: (id: string) => `/alunos/${id}`,
    remove: (id: string) => `/alunos/${id}`,
    reactivate: (id: string) => `/alunos/${id}/reativar`,
    autorizados: {
      list: (alunoId: string) => `/alunos/${alunoId}/autorizados-busca`,
      create: (alunoId: string) => `/alunos/${alunoId}/autorizados-busca`,
      update: (alunoId: string, autorizadoId: string) =>
        `/alunos/${alunoId}/autorizados-busca/${autorizadoId}`,
      remove: (alunoId: string, autorizadoId: string) =>
        `/alunos/${alunoId}/autorizados-busca/${autorizadoId}`,
    },
  },

  responsaveis: {
    search: '/responsaveis',
    update: (id: string) => `/responsaveis/${id}`,
  },

  funcionarios: {
    list: '/funcionarios',
    create: '/funcionarios',
    findOne: (id: string) => `/funcionarios/${id}`,
    update: (id: string) => `/funcionarios/${id}`,
    remove: (id: string) => `/funcionarios/${id}`,
    reactivate: (id: string) => `/funcionarios/${id}/reativar`,
  },
} as const;
