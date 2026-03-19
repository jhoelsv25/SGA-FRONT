import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardFormImports } from '@/shared/components/form';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { ExcelService } from '@core/services/excel.service';
import { ImportDialog } from '@shared/widgets/import-dialog/import-dialog';
import { TeacherForm } from '../../components/teacher-form/teacher-form';
import { TeacherCardComponent } from '../../components/teacher-card/teacher-card';
import { TeacherApi } from '../../services/api/teacher-api';
import { TeacherStore } from '../../services/store/teacher.store';
import { Teacher, TeacherCreate, TeacherParams } from '../../types/teacher-types';
import { TEACHER_ACTIONS } from '../../config/action.config';
import { TEACHER_HEADER_CONFIG } from '../../config/header.config';

const EXCEL_COLUMNS = [
  { key: 'teacherCode', label: 'Codigo docente' },
  { key: 'specialization', label: 'Especialidad' },
  { key: 'professionalTitle', label: 'Titulo profesional' },
  { key: 'university', label: 'Universidad' },
  { key: 'graduationYear', label: 'Anio graduacion' },
  { key: 'professionalLicense', label: 'Licencia profesional' },
  { key: 'contractType', label: 'Tipo contrato' },
  { key: 'laborRegime', label: 'Regimen laboral' },
  { key: 'hireDate', label: 'Fecha contratacion' },
  { key: 'terminationDate', label: 'Fecha termino' },
  { key: 'workloadType', label: 'Carga laboral' },
  { key: 'weeklyHours', label: 'Horas semanales' },
  { key: 'teachingLevel', label: 'Nivel ensenanza' },
  { key: 'employmentStatus', label: 'Estado laboral' },
  { key: 'institution', label: 'ID institucion' },
  { key: 'person', label: 'ID persona' },
];

function parseNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseDate(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date((v - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  return String(v).trim().slice(0, 10);
}

function toEntityId(v: string | { id: string } | undefined | null): string {
  if (!v) return '';
  return typeof v === 'string' ? v : v.id;
}

function normalizeQueryValue(value: string | null): string {
  if (!value) return '';
  if (value === 'undefined' || value === 'null') return '';
  return value;
}

@Component({
  selector: 'sga-teachers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderDetail,
    TeacherCardComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    SelectOptionComponent,
    ZardInputDirective,
    ZardButtonComponent,
    ...ZardFormImports,
  ],
  templateUrl: './teachers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeachersPage {
  private readonly dialog = inject(DialogModalService);
  private readonly confirmDialog = inject(DialogConfirmService);
  private readonly store = inject(TeacherStore);
  private readonly teacherApi = inject(TeacherApi);
  private readonly excel = inject(ExcelService);
  private readonly permissionStore = inject(PermissionCheckStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly headerConfig = TEACHER_HEADER_CONFIG;
  readonly actions = TEACHER_ACTIONS;
  readonly currentSearch = signal('');
  readonly filterContractType = signal('');
  readonly filterLaborRegime = signal('');
  readonly filterWorkloadType = signal('');
  readonly filterEmploymentStatus = signal('');

  readonly contractTypeOptions = [
    { value: '', label: 'Todos' },
    { value: 'full_time', label: 'Tiempo completo' },
    { value: 'part_time', label: 'Medio tiempo' },
    { value: 'temporary', label: 'Temporal' },
    { value: 'permanent', label: 'Permanente' },
  ];
  readonly laborRegimeOptions = [
    { value: '', label: 'Todos' },
    { value: 'public', label: 'Público' },
    { value: 'private', label: 'Privado' },
  ];
  readonly workloadTypeOptions = [
    { value: '', label: 'Todos' },
    { value: '20_hours', label: '20 horas' },
    { value: '30_hours', label: '30 horas' },
    { value: '40_hours', label: '40 horas' },
  ];
  readonly employmentStatusOptions = [
    { value: '', label: 'Todos' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'on_leave', label: 'Licencia' },
  ];

  readonly canManageTeachers = computed(() => this.permissionStore.has('manage_teacher'));
  readonly loading = computed(() => this.store.loading());
  readonly data = computed(() => this.store.teachers());
  readonly filteredData = computed(() => {
    const search = this.currentSearch().toLowerCase().trim();
    const contractType = this.filterContractType();
    const laborRegime = this.filterLaborRegime();
    const workloadType = this.filterWorkloadType();
    const employmentStatus = this.filterEmploymentStatus();

    return this.data().filter((teacher) => {
      const person = typeof teacher.person === 'object' ? teacher.person : null;
      const name = [person?.firstName, person?.lastName].filter(Boolean).join(' ').toLowerCase();
      const email = person?.email?.toLowerCase() ?? '';
      const matchSearch =
        !search ||
        teacher.teacherCode?.toLowerCase().includes(search) ||
        teacher.specialization?.toLowerCase().includes(search) ||
        teacher.professionalTitle?.toLowerCase().includes(search) ||
        name.includes(search) ||
        email.includes(search);

      return (
        matchSearch &&
        (!contractType || teacher.contractType === contractType) &&
        (!laborRegime || teacher.laborRegime === laborRegime) &&
        (!workloadType || teacher.workloadType === workloadType) &&
        (!employmentStatus || teacher.employmentStatus === employmentStatus)
      );
    });
  });

  readonly hasActiveFilters = computed(
    () =>
      !!this.currentSearch().trim() ||
      !!this.filterContractType() ||
      !!this.filterLaborRegime() ||
      !!this.filterWorkloadType() ||
      !!this.filterEmploymentStatus(),
  );

  readonly filteredHeaderActions = computed(() =>
    this.permissionStore.filterActions(this.actions.filter((a) => a.typeAction === 'header')),
  );

  constructor() {
    this.route.queryParamMap.subscribe((query) => {
      const search = normalizeQueryValue(query.get('search'));
      const contractType = normalizeQueryValue(query.get('contractType'));
      const laborRegime = normalizeQueryValue(query.get('laborRegime'));
      const workloadType = normalizeQueryValue(query.get('workloadType'));
      const employmentStatus = normalizeQueryValue(query.get('employmentStatus'));

      this.currentSearch.set(search);
      this.filterContractType.set(contractType);
      this.filterLaborRegime.set(laborRegime);
      this.filterWorkloadType.set(workloadType);
      this.filterEmploymentStatus.set(employmentStatus);

      const params: TeacherParams = {
        page: 1,
        size: 999,
        search: search || undefined,
        contractType: (contractType || undefined) as TeacherParams['contractType'],
        laborRegime: (laborRegime || undefined) as TeacherParams['laborRegime'],
        workloadType: (workloadType || undefined) as TeacherParams['workloadType'],
        employmentStatus: (employmentStatus || undefined) as TeacherParams['employmentStatus'],
      };
      this.store.loadAll(params);
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
    if (e.action.key === 'attendances') this.goToAttendances();
    if (e.action.key === 'downloadTemplate') this.downloadTemplate();
    if (e.action.key === 'import') this.openImport();
    if (e.action.key === 'export') this.export();
  }

  onSearch(value: string) {
    this.currentSearch.set(value);
    this.syncUrl();
  }

  onFilterContractType(value: unknown) {
    this.filterContractType.set(value != null ? String(value) : '');
    this.syncUrl();
  }

  onFilterLaborRegime(value: unknown) {
    this.filterLaborRegime.set(value != null ? String(value) : '');
    this.syncUrl();
  }

  onFilterWorkloadType(value: unknown) {
    this.filterWorkloadType.set(value != null ? String(value) : '');
    this.syncUrl();
  }

  onFilterEmploymentStatus(value: unknown) {
    this.filterEmploymentStatus.set(value != null ? String(value) : '');
    this.syncUrl();
  }

  clearFilters() {
    this.currentSearch.set('');
    this.filterContractType.set('');
    this.filterLaborRegime.set('');
    this.filterWorkloadType.set('');
    this.filterEmploymentStatus.set('');
    this.syncUrl();
  }

  onRefresh() {
    this.store.loadAll({
      page: 1,
      size: 999,
      search: this.currentSearch() || undefined,
      contractType: (this.filterContractType() || undefined) as TeacherParams['contractType'],
      laborRegime: (this.filterLaborRegime() || undefined) as TeacherParams['laborRegime'],
      workloadType: (this.filterWorkloadType() || undefined) as TeacherParams['workloadType'],
      employmentStatus: (this.filterEmploymentStatus() || undefined) as TeacherParams['employmentStatus'],
    });
  }

  goToAttendances() {
    this.router.navigate(['/teachers/attendances']);
  }

  goToTeacherAttendances(teacher: Teacher) {
    const person = typeof teacher.person === 'object' ? teacher.person : null;
    const teacherName = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim() || teacher.teacherCode;
    this.router.navigate(['/teachers/attendances'], {
      queryParams: { teacherId: teacher.id, teacherName },
    });
  }

  goToDetail(teacher: Teacher) {
    this.router.navigate(['/teachers', teacher.id], {
      state: { teacher },
    });
  }

  editTeacher(teacher: Teacher) {
    this.openForm(teacher);
  }

  deleteTeacher(teacher: Teacher) {
    const person = typeof teacher.person === 'object' ? teacher.person : null;
    const label = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim() || teacher.teacherCode;
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar docente',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${label}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(teacher.id).subscribe();
        }
      });
  }

  goToAssignments(teacher: Teacher) {
    const person = typeof teacher.person === 'object' ? teacher.person : null;
    const teacherName = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim() || teacher.teacherCode;
    this.router.navigate(['/organization/section-courses'], {
      queryParams: { teacherId: teacher.id, teacherName },
    });
  }

  goToSchedules(teacher: Teacher) {
    const person = typeof teacher.person === 'object' ? teacher.person : null;
    const teacherName = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim() || teacher.teacherCode;
    this.router.navigate(['/organization/schedules'], {
      queryParams: { teacherId: teacher.id, teacherName },
    });
  }

  createFromEmpty() {
    if (!this.canManageTeachers()) return;
    this.openForm();
  }

  openForm(current?: Teacher | null): void {
    const ref = this.dialog.open(TeacherForm, {
      data: { current: current ?? null },
      width: '720px',
      maxHeight: '80vh',
    });

    ref.closed.subscribe(() => this.onRefresh());
  }

  private syncUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.currentSearch() || null,
        contractType: this.filterContractType() || null,
        laborRegime: this.filterLaborRegime() || null,
        workloadType: this.filterWorkloadType() || null,
        employmentStatus: this.filterEmploymentStatus() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  downloadTemplate(): void {
    this.excel.downloadTemplate(
      EXCEL_COLUMNS,
      {
        teacherCode: 'T20250001',
        specialization: 'Matematicas',
        professionalTitle: 'Licenciado en Educacion',
        university: 'Universidad Nacional',
        graduationYear: 2015,
        professionalLicense: 'COL-123456',
        contractType: 'full_time',
        laborRegime: 'public',
        hireDate: new Date().toISOString().slice(0, 10),
        terminationDate: '',
        workloadType: '40_hours',
        weeklyHours: 40,
        teachingLevel: 'Secundaria',
        employmentStatus: 'active',
        institution: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
        person: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
      },
      { sheetName: 'Docentes', fileName: 'plantilla_docentes.xlsx' },
    );
  }

  openImport(): void {
    const ref = this.dialog.open(ImportDialog, {
      data: {
        title: 'Importar docentes',
        columns: EXCEL_COLUMNS,
        exampleRow: {
          teacherCode: 'T20250001',
          specialization: 'Matematicas',
          professionalTitle: 'Licenciado en Educacion',
          university: 'Universidad Nacional',
          graduationYear: 2015,
          professionalLicense: 'COL-123456',
          contractType: 'full_time',
          laborRegime: 'public',
          hireDate: new Date().toISOString().slice(0, 10),
          terminationDate: '',
          workloadType: '40_hours',
          weeklyHours: 40,
          teachingLevel: 'Secundaria',
          employmentStatus: 'active',
          institution: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
          person: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
        },
        templateSheetName: 'Docentes',
        validateRow: (row: Record<string, unknown>) => {
          if (!String(row['teacherCode'] ?? '').trim()) return 'Codigo docente requerido';
          if (!String(row['specialization'] ?? '').trim()) return 'Especialidad requerida';
          if (!String(row['professionalTitle'] ?? '').trim()) return 'Titulo profesional requerido';
          if (!String(row['institution'] ?? '').trim()) return 'ID institucion requerido';
          if (!String(row['person'] ?? '').trim()) return 'ID persona requerido';
          return null;
        },
        importRows: (rows: Record<string, unknown>[]) =>
          this.teacherApi.import(
            rows.map((r) =>
              ({
                teacherCode: String(r['teacherCode'] ?? '').trim(),
                specialization: String(r['specialization'] ?? '').trim(),
                professionalTitle: String(r['professionalTitle'] ?? '').trim(),
                university: String(r['university'] ?? '').trim(),
                graduationYear: parseNumber(r['graduationYear'], new Date().getFullYear()),
                professionalLicense: String(r['professionalLicense'] ?? '').trim(),
                contractType: String(r['contractType'] ?? 'full_time').trim(),
                laborRegime: String(r['laborRegime'] ?? 'public').trim(),
                hireDate: parseDate(r['hireDate']) ?? new Date().toISOString().slice(0, 10),
                terminationDate: parseDate(r['terminationDate']),
                workloadType: String(r['workloadType'] ?? '40_hours').trim(),
                weeklyHours: parseNumber(r['weeklyHours'], 40),
                teachingLevel: String(r['teachingLevel'] ?? '').trim(),
                employmentStatus: String(r['employmentStatus'] ?? 'active').trim(),
                institution: String(r['institution'] ?? '').trim(),
                person: String(r['person'] ?? '').trim(),
              }) as Partial<TeacherCreate>,
            ),
          ),
      },
      width: '720px',
      maxHeight: '80vh',
    });

    ref.closed.subscribe(() => this.onRefresh());
  }

  export(): void {
    this.teacherApi.getAll({ page: 1, size: 9999 }).subscribe((res) => {
      const data = (res.data ?? []).map((t) => ({
        teacherCode: t.teacherCode,
        specialization: t.specialization,
        professionalTitle: t.professionalTitle,
        university: t.university,
        graduationYear: t.graduationYear,
        professionalLicense: t.professionalLicense,
        contractType: t.contractType,
        laborRegime: t.laborRegime,
        hireDate: t.hireDate?.slice(0, 10) ?? '',
        terminationDate: t.terminationDate?.slice(0, 10) ?? '',
        workloadType: t.workloadType,
        weeklyHours: t.weeklyHours,
        teachingLevel: t.teachingLevel,
        employmentStatus: t.employmentStatus,
        institution: toEntityId(t.institution),
        person: toEntityId(t.person),
      }));
      this.excel.downloadExport(EXCEL_COLUMNS, data, {
        sheetName: 'Docentes',
        fileName: `docentes_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    });
  }
}
