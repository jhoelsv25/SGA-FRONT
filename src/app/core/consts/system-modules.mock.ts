export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route?: string;
  order?: number;
  permissions?: string[];
  children?: MenuItem[];
  visibility?: Visibility;
  isSystem?: boolean;
  badge?: number;
}

const crud = (resource: string) => [
  `${resource}:view`,
  `${resource}:create`,
  `${resource}:update`,
  `${resource}:delete`,
];

export const MENU_MODULES_MOCK: MenuItem[] = [
  {
    id: 'dashboard',
    icon: 'fa-home',
    label: 'Dashboard',
    route: '/dashboard',
    order: 1,
    permissions: ['dashboard:view'],
    visibility: Visibility.PUBLIC,
  },

  // ============================================
  // CONFIGURACIÓN ACADÉMICA (Tablas de Sistema)
  // ============================================
  {
    id: 'academic-setup',
    icon: 'fa-cog',
    label: 'Estructura Académica',
    route: '/academic-setup',
    order: 2,
    permissions: ['academic-setup:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'academic-years',
        icon: 'fa-calendar-alt',
        label: 'Años Académicos',
        route: '/academic-setup/years',
        permissions: crud('academic-year'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'grade-levels',
        icon: 'fa-layer-group',
        label: 'Niveles y Grados',
        route: '/academic-setup/grade-levels',
        permissions: crud('grade-level'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'subject-areas',
        icon: 'fa-th',
        label: 'Áreas Curriculares',
        route: '/academic-setup/subject-areas',
        permissions: crud('subject-area'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'courses',
        icon: 'fa-book',
        label: 'Cursos',
        route: '/academic-setup/courses',
        permissions: crud('course'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'competencies',
        icon: 'fa-star',
        label: 'Competencias',
        route: '/academic-setup/competencies',
        permissions: crud('competency'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'sections',
        icon: 'fa-users',
        label: 'Secciones',
        route: '/organization/sections',
        permissions: crud('section'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'schedules',
        icon: 'fa-calendar-days',
        label: 'Horarios',
        route: '/organization/schedules',
        permissions: crud('schedule'),
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // ESTUDIANTES (students, guardians, enrollments)
  // ============================================
  {
    id: 'students',
    icon: 'fa-user-graduate',
    label: 'Estudiantes',
    route: '/students',
    order: 3,
    permissions: ['student:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'students-list',
        icon: 'fa-list',
        label: 'Lista de Estudiantes',
        route: '/students/list',
        permissions: ['student:view', 'student:import', 'student:export'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'enrollments',
        icon: 'fa-file-signature',
        label: 'Matrículas',
        route: '/students/enrollments',
        permissions: crud('enrollment'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'guardians',
        icon: 'fa-user-shield',
        label: 'Apoderados',
        route: '/students/guardians',
        permissions: crud('guardian'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'student-observations',
        icon: 'fa-comment-medical',
        label: 'Observaciones',
        route: '/students/observations',
        permissions: crud('observation'),
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // DOCENTES (teachers, teacher_attendances)
  // ============================================
  {
    id: 'teachers',
    icon: 'fa-chalkboard-teacher',
    label: 'Docentes',
    route: '/teachers',
    order: 4,
    permissions: ['teacher:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'teachers-list',
        icon: 'fa-list',
        label: 'Lista de Docentes',
        route: '/teachers/list',
        permissions: ['teacher:view', 'teacher:import', 'teacher:export'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'teacher-daily-attendance',
        icon: 'fa-user-clock',
        label: 'Asistencia Docente',
        route: '/teachers/daily-monitoring',
        permissions: ['teacher_attendance:view', 'teacher-attendance:view'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'teacher-attendances',
        icon: 'fa-chalkboard-teacher',
        label: 'Seguimiento Docente',
        route: '/teachers/attendances',
        permissions: [
          'teacher_attendance:view',
          'teacher-attendance:view',
          'teacher-attendance:create',
          'teacher-attendance:update',
          'teacher-attendance:delete',
          'teacher-attendance:register',
          'teacher-attendance:import',
          'teacher-attendance:export',
        ],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // ASISTENCIA (attendances)
  // ============================================
  {
    id: 'access-control',
    icon: 'fa-qrcode',
    label: 'Control de Accesos',
    route: '/access-control',
    order: 5,
    permissions: ['attendance:quick-register'],
    visibility: Visibility.PUBLIC,
  },

  {
    id: 'attendance',
    icon: 'fa-clipboard-check',
    label: 'Asistencia Estudiantes',
    route: '/attendance',
    order: 6,
    permissions: ['attendance:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'attendance-register',
        icon: 'fa-check-circle',
        label: 'Registro de Asistencia',
        route: '/attendance/register',
        permissions: [
          'attendance:view',
          'attendance:create',
          'attendance:update',
          'attendance:register',
          'attendance:quick-register',
          'attendance:import',
          'attendance:export',
        ],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'attendance-reports',
        icon: 'fa-chart-pie',
        label: 'Reportes',
        route: '/attendance/reports',
        permissions: ['attendance:view'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // EVALUACIONES (assessments, assessment_scores, grades)
  // ============================================
  {
    id: 'assessments',
    icon: 'fa-file-alt',
    label: 'Evaluaciones',
    route: '/assessments',
    order: 6,
    permissions: ['assessment:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'assessments-list',
        icon: 'fa-clipboard-list',
        label: 'Evaluaciones',
        route: '/assessments/list',
        permissions: crud('assessment'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'assessment-scores',
        icon: 'fa-pen-square',
        label: 'Registro de Calificaciones',
        route: '/assessments/scores',
        permissions: [
          'assessment-score:view',
          'assessment-score:create',
          'assessment-score:update',
          'assessment-score:delete',
          'assessment-score:import',
          'assessment-score:export',
        ],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'grades',
        icon: 'fa-chart-line',
        label: 'Notas Finales',
        route: '/assessments/grades',
        permissions: crud('grade'),
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // CONDUCTA (behavior_records)
  // ============================================
  {
    id: 'behavior',
    icon: 'fa-flag',
    label: 'Conducta',
    route: '/behavior',
    order: 7,
    permissions: ['behavior:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'behavior-records',
        icon: 'fa-clipboard',
        label: 'Registro de Conducta',
        route: '/behavior/records',
        permissions: crud('behavior'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'behavior-reports',
        icon: 'fa-chart-bar',
        label: 'Reportes',
        route: '/behavior/reports',
        permissions: ['behavior:view'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // AULA VIRTUAL (virtual_classrooms, learning_modules, etc.)
  // ============================================
  {
    id: 'virtual-classroom',
    icon: 'fa-chalkboard',
    label: 'Aula Virtual',
    route: '/virtual-classroom/list',
    order: 8,
    permissions: ['virtual-classroom:view'],
    visibility: Visibility.PUBLIC,
  },

  // ============================================
  // PAGOS (payments)
  // ============================================
  {
    id: 'payments',
    icon: 'fa-money-bill-wave',
    label: 'Pagos',
    route: '/payments',
    order: 9,
    permissions: ['payment:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'payments-register',
        icon: 'fa-file-invoice-dollar',
        label: 'Registro de Pagos',
        route: '/payments/register',
        permissions: crud('payment'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'payments-pending',
        icon: 'fa-exclamation-triangle',
        label: 'Pendientes',
        route: '/payments/pending',
        permissions: ['payment:view'],
        badge: 0,
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'payments-history',
        icon: 'fa-history',
        label: 'Historial',
        route: '/payments/history',
        permissions: ['payment:view'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // COMUNICACIONES (announcements, notifications, email_logs)
  // ============================================
  {
    id: 'communications',
    icon: 'fa-bullhorn',
    label: 'Comunicaciones',
    route: '/communications',
    order: 10,
    permissions: ['communication:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'announcements',
        icon: 'fa-bullhorn',
        label: 'Anuncios',
        route: '/communications/announcements',
        permissions: crud('announcement'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'notifications',
        icon: 'fa-bell',
        label: 'Notificaciones',
        route: '/communications/notifications',
        permissions: ['notification:view'],
        badge: 0,
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'email-logs',
        icon: 'fa-envelope-open-text',
        label: 'Historial de Emails',
        route: '/communications/email-logs',
        permissions: ['email-log:view'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // REPORTES (consolidado)
  // ============================================
  {
    id: 'reports',
    icon: 'fa-chart-bar',
    label: 'Reportes',
    route: '/reports',
    order: 11,
    permissions: crud('report'),
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'reports-academic',
        icon: 'fa-graduation-cap',
        label: 'Académicos',
        route: '/reports/academic',
        permissions: crud('report'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'reports-attendance',
        icon: 'fa-user-check',
        label: 'Asistencia',
        route: '/reports/attendance',
        permissions: crud('report'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'reports-behavior',
        icon: 'fa-flag',
        label: 'Conducta',
        route: '/reports/behavior',
        permissions: crud('report'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'reports-financial',
        icon: 'fa-money-bill-wave',
        label: 'Financieros',
        route: '/reports/financial',
        permissions: crud('report'),
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // ADMINISTRACIÓN (institutions, users, roles, sessions, audit_logs)
  // ============================================
  {
    id: 'administration',
    icon: 'fa-cogs',
    label: 'Administración',
    route: '/administration',
    order: 12,
    permissions: ['administration:view'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'institution',
        icon: 'fa-building',
        label: 'Institución',
        route: '/administration/institution',
        permissions: crud('institution'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'users',
        icon: 'fa-users-cog',
        label: 'Usuarios',
        route: '/administration/users',
        permissions: crud('user'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'roles',
        icon: 'fa-user-tag',
        label: 'Roles',
        route: '/administration/roles',
        permissions: crud('role'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'permissions',
        icon: 'fa-key',
        label: 'Permisos',
        route: '/administration/permissions',
        permissions: crud('permission'),
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'sessions',
        icon: 'fa-desktop',
        label: 'Sesiones Activas',
        route: '/administration/sessions',
        permissions: ['session:view', 'session:delete', 'sessions:view', 'sessions:delete'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'audit-logs',
        icon: 'fa-file-search',
        label: 'Auditoría',
        route: '/administration/audit-logs',
        permissions: ['audit-log:view', 'audit_log:view'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },
];
