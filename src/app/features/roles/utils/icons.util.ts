export const MODULE_ICON_MAP: Record<string, string> = {
  Dashboard: 'home',
  Administración: 'cogs',
  'Configuración Académica': 'cog',
  'Años Académicos': 'calendar-alt',
  'Períodos Académicos': 'clock',
  'Niveles y Grados': 'layer-group',
  'Áreas Curriculares': 'th',
  Cursos: 'book',
  Competencias: 'star',
  'Organización Escolar': 'sitemap',
  Secciones: 'users',
  'Cursos por Sección': 'link',
  Horarios: 'calendar-days',
  Estudiantes: 'user-graduate',
  Matrículas: 'file-signature',
  Apoderados: 'user-shield',
  Docentes: 'chalkboard-teacher',
  Asistencia: 'clipboard-check',
  Evaluaciones: 'file-alt',
  Conducta: 'flag',
  'Aula Virtual': 'chalkboard',
  Pagos: 'money-bill-wave',
  Comunicaciones: 'bullhorn',
  Reportes: 'chart-bar',
  Usuarios: 'users-cog',
  Roles: 'user-tag',
  Permisos: 'key',
  Institución: 'building',
};

export function getModuleIcon(moduleName: string): string {
  return MODULE_ICON_MAP[moduleName] || 'cubes';
}
