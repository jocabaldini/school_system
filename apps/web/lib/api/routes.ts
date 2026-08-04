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
    enrollments: {
      list: (studentId: string) => `/students/${studentId}/enrollments`,
      create: (studentId: string) => `/students/${studentId}/enrollments`,
      update: (studentId: string, enrollmentId: string) =>
        `/students/${studentId}/enrollments/${enrollmentId}`,
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

  schoolClasses: {
    list: '/school-classes',
    create: '/school-classes',
    findOne: (id: string) => `/school-classes/${id}`,
    update: (id: string) => `/school-classes/${id}`,
    remove: (id: string) => `/school-classes/${id}`,
    reactivate: (id: string) => `/school-classes/${id}/reactivate`,
  },

  settings: {
    get: '/settings',
    update: '/settings',
  },

  enrollments: {
    calculate: '/enrollments/calculate',
  },
} as const;
