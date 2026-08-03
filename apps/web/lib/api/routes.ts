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

  students: {
    list: '/students',
    create: '/students',
    findOne: (id: string) => `/students/${id}`,
    update: (id: string) => `/students/${id}`,
    remove: (id: string) => `/students/${id}`,
    reactivate: (id: string) => `/students/${id}/reactivate`,
    authorizedPickups: {
      list: (studentId: string) => `/students/${studentId}/authorized-pickups`,
      create: (studentId: string) => `/students/${studentId}/authorized-pickups`,
      update: (studentId: string, pickupId: string) =>
        `/students/${studentId}/authorized-pickups/${pickupId}`,
      remove: (studentId: string, pickupId: string) =>
        `/students/${studentId}/authorized-pickups/${pickupId}`,
    },
  },

  guardians: {
    search: '/guardians',
    update: (id: string) => `/guardians/${id}`,
  },

  employees: {
    list: '/employees',
    create: '/employees',
    findOne: (id: string) => `/employees/${id}`,
    update: (id: string) => `/employees/${id}`,
    remove: (id: string) => `/employees/${id}`,
    reactivate: (id: string) => `/employees/${id}/reactivate`,
  },
} as const;
