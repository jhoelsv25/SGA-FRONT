# Pendientes del proyecto SGA-FRONT

Resumen de lo que falta por hacer, ordenado por prioridad/área.

---

## Hecho recientemente

- **Tests**: app.spec.ts actualizado (router-outlet, mock de matchMedia). Corregido typo `§` en toast.
- **Sidebar**: permisos reales con `AuthFacade.hasPermission()` (muestra ítems si el usuario tiene al menos un permiso del ítem).
- **Competencias**: API real en `CompetencyApi.getAll()` (GET competencies); formulario carga cursos desde `CourseApi`.
- **Home**: notificaciones conectadas a `NotificationService` (hasUnread); la configuración de correo para notificaciones queda aparte.
- **Section-courses**: página propia que lista cursos por sección (SectionCourseApi); ruta en organization actualizada.
- **Classroom tareas**: carga desde `ClassroomApi.getTasks(sectionCourseId)`; si el backend no existe o falla, se muestra mock.

---

## Pendiente

### Configuración / correo

| Item | Descripción |
|------|-------------|
| **Configuración correo (notificaciones)** | Configuración de envío de notificaciones por correo (backend + pantalla de configuración si aplica). El front ya tiene `NotificationService` y el home usa `hasUnread()`; falta la parte de correo. |

---

## Backend (endpoints que el front ya usa o espera)

| Item | Descripción |
|------|-------------|
| **GET section-course/:id** | El classroom usa `SectionCourseApi.getById(id)` para mostrar el nombre del aula (curso - sección). Si no existe, se muestra "Aula Virtual". |
| **GET classroom/:sectionCourseId/teachers** | La pestaña Personas del classroom lista docentes. Si el endpoint no existe, la lista de profesores queda vacía. |
| **POST students/import** | Body: `{ rows: StudentCreate[] }`. Respuesta: `{ created: number, errors?: { row, message }[] }`. |
| **POST teachers/import** | Body: `{ rows: Partial<Teacher>[] }`. Misma forma de respuesta. |

---

## Módulos con datos mock o API por implementar

| Módulo | Pendiente |
|--------|-----------|
| **Competencias** | `CompetencyApi.getAll()` devuelve `of([])`. Implementar llamada HTTP real. En el formulario: cargar cursos reales (CourseApi) en lugar del TODO. |
| **Classroom – Tareas** | `tasks.ts` usa un array estático de tareas. Conectar con API de tareas/entregas por `sectionCourseId` cuando el backend lo exponga. |
| **Classroom – Timeline** | Si no hay datos, se usa `mockFeed`. Los comentarios del post son estáticos. Cuando exista API de comentarios, conectar "Escribe una respuesta pública" y la lista. |
| **Home** | `hasNotifications = signal(true)` está hardcodeado. Conectar con servicio de notificaciones real cuando exista. |
| **Sidebar** | Comentario TODO: implementar lógica de permisos real (AuthFacade o PermissionService). |

---

## Rutas / organización

| Item | Descripción |
|------|-------------|
| **Section-courses** | En `organization.routes.ts`, la ruta `section-courses` carga el componente de **Secciones**. Si debe ser una vista específica de “curso por sección”, crear un componente/página `section-courses` y usarla aquí. |

---

## Opcional / mejoras

- **Build budgets**: Si el build avisa por tamaño de CSS/fuentes, ajustar `angular.json` (budgets) o reducir recursos.
- **Comentarios en timeline**: Cuando el backend tenga endpoint de comentarios por post, sustituir el bloque estático por datos reales y envío desde el formulario.
- **Export desde backend**: Si se prefiere que el Excel lo genere el servidor, implementar el `ExcelService` en backend (ver `docs/IMPORT_EXPORT_BACKEND.md`) y llamar desde el front a un `GET .../export` que devuelva el archivo.

---

## Resumen rápido

1. Arreglar **app.spec.ts** para que los tests pasen.
2. Backend: **section-course/:id**, **classroom/:id/teachers**, **students/import**, **teachers/import**.
3. Sustituir mocks: **Competencias** (API + cursos en el form), **Classroom tareas** (API), **Timeline** (comentarios cuando exista API).
4. Opcional: **notificaciones** en home, **permisos** en sidebar, **section-courses** como vista propia, **budgets** del build.
