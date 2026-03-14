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

export const MENU_MODULES_MOCK: MenuItem[] = [
  {
    id: 'dashboard',
    icon: 'fa-home',
    label: 'Dashboard',
    route: '/dashboard',
    order: 1,
    permissions: ['view_dashboard'],
    visibility: Visibility.PUBLIC,
  },

  // ============================================
  // CONFIGURACIÓN ACADÉMICA (Tablas de Sistema)
  // ============================================
  {
    id: 'academic-setup',
    icon: 'fa-cog',
    label: 'Configuración Académica',
    route: '/academic-setup',
    order: 2,
    permissions: ['manage_academic_setup'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'academic-years',
        icon: 'fa-calendar-alt',
        label: 'Años Académicos',
        route: '/academic-setup/years',
        permissions: ['view_academic_year', 'manage_academic_year'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'academic-periods',
        icon: 'fa-clock',
        label: 'Períodos Académicos',
        route: '/academic-setup/periods',
        permissions: ['view_academic_period', 'manage_academic_period'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'grade-levels',
        icon: 'fa-layer-group',
        label: 'Niveles y Grados',
        route: '/academic-setup/grade-levels',
        permissions: ['view_grade_level', 'manage_grade_level'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'subject-areas',
        icon: 'fa-th',
        label: 'Áreas Curriculares',
        route: '/academic-setup/subject-areas',
        permissions: ['view_subject_area', 'manage_subject_area'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'courses',
        icon: 'fa-book',
        label: 'Cursos',
        route: '/academic-setup/courses',
        permissions: ['view_course', 'manage_course'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'competencies',
        icon: 'fa-star',
        label: 'Competencias',
        route: '/academic-setup/competencies',
        permissions: ['view_competency', 'manage_competency'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // ORGANIZACIÓN (Secciones y Horarios)
  // ============================================
  {
    id: 'organization',
    icon: 'fa-sitemap',
    label: 'Organización Escolar',
    route: '/organization',
    order: 3,
    permissions: ['view_organization'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'sections',
        icon: 'fa-users',
        label: 'Secciones',
        route: '/organization/sections',
        permissions: ['view_section', 'manage_section'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'section-courses',
        icon: 'fa-link',
        label: 'Cursos por Sección',
        route: '/organization/section-courses',
        permissions: ['view_section_course', 'manage_section_course'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'schedules',
        icon: 'fa-calendar-days',
        label: 'Horarios',
        route: '/organization/schedules',
        permissions: ['view_schedule', 'manage_schedule'],
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
    order: 4,
    permissions: ['view_student'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'students-list',
        icon: 'fa-list',
        label: 'Lista de Estudiantes',
        route: '/students/list',
        permissions: ['view_student'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'enrollments',
        icon: 'fa-file-signature',
        label: 'Matrículas',
        route: '/students/enrollments',
        permissions: ['view_enrollment', 'manage_enrollment'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'guardians',
        icon: 'fa-user-shield',
        label: 'Apoderados',
        route: '/students/guardians',
        permissions: ['view_guardian', 'manage_guardian'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'student-observations',
        icon: 'fa-comment-medical',
        label: 'Observaciones',
        route: '/students/observations',
        permissions: ['view_observation', 'manage_observation'],
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
    order: 5,
    permissions: ['view_teacher'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'teachers-list',
        icon: 'fa-list',
        label: 'Lista de Docentes',
        route: '/teachers/list',
        permissions: ['view_teacher'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'teacher-attendances',
        icon: 'fa-user-check',
        label: 'Asistencia Docente',
        route: '/teachers/attendances',
        permissions: ['view_teacher_attendance', 'manage_teacher_attendance'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // ASISTENCIA (attendances)
  // ============================================
  {
    id: 'attendance',
    icon: 'fa-clipboard-check',
    label: 'Asistencia Estudiantes',
    route: '/attendance',
    order: 6,
    permissions: ['view_attendance'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'attendance-register',
        icon: 'fa-check-circle',
        label: 'Registro de Asistencia',
        route: '/attendance/register',
        permissions: ['manage_attendance'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'attendance-reports',
        icon: 'fa-chart-pie',
        label: 'Reportes',
        route: '/attendance/reports',
        permissions: ['view_attendance'],
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
    order: 7,
    permissions: ['view_assessment'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'assessments-list',
        icon: 'fa-clipboard-list',
        label: 'Evaluaciones',
        route: '/assessments/list',
        permissions: ['view_assessment', 'manage_assessment'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'assessment-scores',
        icon: 'fa-pen-square',
        label: 'Registro de Calificaciones',
        route: '/assessments/scores',
        permissions: ['manage_assessment_score'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'grades',
        icon: 'fa-chart-line',
        label: 'Notas Finales',
        route: '/assessments/grades',
        permissions: ['view_grade', 'manage_grade'],
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
    order: 8,
    permissions: ['view_behavior'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'behavior-records',
        icon: 'fa-clipboard',
        label: 'Registro de Conducta',
        route: '/behavior/records',
        permissions: ['view_behavior', 'manage_behavior'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'behavior-reports',
        icon: 'fa-chart-bar',
        label: 'Reportes',
        route: '/behavior/reports',
        permissions: ['view_behavior'],
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
    route: '/virtual-classroom',
    order: 9,
    permissions: ['view_virtual_classroom'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'virtual-classrooms-list',
        icon: 'fa-door-open',
        label: 'Mis Aulas',
        route: '/virtual-classroom/list',
        permissions: ['view_virtual_classroom'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'learning-modules',
        icon: 'fa-folder',
        label: 'Módulos de Aprendizaje',
        route: '/virtual-classroom/list',
        permissions: ['view_learning_module', 'manage_learning_module'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'learning-materials',
        icon: 'fa-file',
        label: 'Materiales',
        route: '/virtual-classroom/list',
        permissions: ['view_learning_material', 'manage_learning_material'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'assignments',
        icon: 'fa-tasks',
        label: 'Tareas',
        route: '/virtual-classroom/list',
        permissions: ['view_assignment', 'manage_assignment'],
        badge: 0,
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'assignment-submissions',
        icon: 'fa-upload',
        label: 'Entregas',
        route: '/virtual-classroom/list',
        permissions: ['view_assignment_submission', 'manage_assignment_submission'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'forums',
        icon: 'fa-comments',
        label: 'Foros',
        route: '/virtual-classroom/list',
        permissions: ['view_forum', 'manage_forum'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'chat',
        icon: 'fa-comment-dots',
        label: 'Chat',
        route: '/virtual-classroom/list',
        permissions: ['view_chat'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },

  // ============================================
  // PAGOS (payments)
  // ============================================
  {
    id: 'payments',
    icon: 'fa-money-bill-wave',
    label: 'Pagos',
    route: '/payments',
    order: 10,
    permissions: ['view_payment'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'payments-register',
        icon: 'fa-file-invoice-dollar',
        label: 'Registro de Pagos',
        route: '/payments/register',
        permissions: ['manage_payment'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'payments-pending',
        icon: 'fa-exclamation-triangle',
        label: 'Pendientes',
        route: '/payments/pending',
        permissions: ['view_payment'],
        badge: 0,
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'payments-history',
        icon: 'fa-history',
        label: 'Historial',
        route: '/payments/history',
        permissions: ['view_payment'],
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
    order: 11,
    permissions: ['view_communication'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'announcements',
        icon: 'fa-bullhorn',
        label: 'Anuncios',
        route: '/communications/announcements',
        permissions: ['view_announcement', 'manage_announcement'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'notifications',
        icon: 'fa-bell',
        label: 'Notificaciones',
        route: '/communications/notifications',
        permissions: ['view_notification'],
        badge: 0,
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'email-logs',
        icon: 'fa-envelope-open-text',
        label: 'Historial de Emails',
        route: '/communications/email-logs',
        permissions: ['view_email_log'],
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
    order: 12,
    permissions: ['view_reports'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'reports-academic',
        icon: 'fa-graduation-cap',
        label: 'Académicos',
        route: '/reports/academic',
        permissions: ['view_report'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'reports-attendance',
        icon: 'fa-user-check',
        label: 'Asistencia',
        route: '/reports/attendance',
        permissions: ['view_report'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'reports-behavior',
        icon: 'fa-flag',
        label: 'Conducta',
        route: '/reports/behavior',
        permissions: ['view_report'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'reports-financial',
        icon: 'fa-money-bill-wave',
        label: 'Financieros',
        route: '/reports/financial',
        permissions: ['view_report'],
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
    order: 13,
    permissions: ['view_administration'],
    visibility: Visibility.PUBLIC,
    children: [
      {
        id: 'institution',
        icon: 'fa-building',
        label: 'Institución',
        route: '/administration/institution',
        permissions: ['manage_institution'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'users',
        icon: 'fa-users-cog',
        label: 'Usuarios',
        route: '/administration/users',
        permissions: ['view_user', 'manage_user'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'roles',
        icon: 'fa-user-tag',
        label: 'Roles',
        route: '/administration/roles',
        permissions: ['view_role', 'manage_role'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'permissions',
        icon: 'fa-key',
        label: 'Permisos',
        route: '/administration/permissions',
        permissions: ['view_permission', 'manage_permission'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'sessions',
        icon: 'fa-desktop',
        label: 'Sesiones Activas',
        route: '/administration/sessions',
        permissions: ['view_sessions', 'manage_sessions'],
        visibility: Visibility.PUBLIC,
      },
      {
        id: 'audit-logs',
        icon: 'fa-file-search',
        label: 'Auditoría',
        route: '/administration/audit-logs',
        permissions: ['view_audit_log'],
        visibility: Visibility.PUBLIC,
      },
    ],
  },
];
