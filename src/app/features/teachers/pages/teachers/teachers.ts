import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceSorting } from '@core/types/data-source-types';
import { ExcelService } from '@core/services/excel.service';
import { TeacherForm } from '@features/teachers/components/teacher-form/teacher-form';
import { TEACHER_COLUMN } from '@features/teachers/config/column.config';
import { TeacherApi } from '@features/teachers/services/api/teacher-api';
import { TeacherStore } from '@features/teachers/services/store/teacher.store';
import { Teacher, TeacherCreate, TeacherParams } from '@features/teachers/types/teacher-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { ImportDialog } from '@shared/components/import-dialog/import-dialog';
import { Dropdown, DropdownItem } from '@shared/ui/dropdown/dropdown';
import { ListToolbar } from '@shared/ui/list-toolbar';
import { Select, SelectOption } from '@shared/ui/select/select';

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
  imports: [ListToolbar, Select, DataSource, Dropdown],
  templateUrl: './teachers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeachersPage implements OnInit {
  private readonly dialog = inject(Dialog);
  private readonly store = inject(TeacherStore);
  private readonly teacherApi = inject(TeacherApi);
  private readonly excel = inject(ExcelService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly currentSearch = signal('');
  private readonly currentSort = signal<DataSourceSorting | null>(null);
  readonly filterContractType = signal<string>('');
  readonly filterLaborRegime = signal<string>('');
  readonly filterWorkloadType = signal<string>('');
  readonly filterEmploymentStatus = signal<string>('');

  columns = computed(() => TEACHER_COLUMN);
  data = computed(() => this.store.teachers());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  rowActions = computed<ActionConfig[]>(() => [
    { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary' as const },
    { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger' as const },
  ]);
  filterCount = computed(() => {
    let count = 0;
    if (this.filterContractType()) count++;
    if (this.filterLaborRegime()) count++;
    if (this.filterWorkloadType()) count++;
    if (this.filterEmploymentStatus()) count++;
    return count;
  });

  contractTypeOptions: SelectOption[] = [
    { value: '', label: 'Todos' },
    { value: 'full_time', label: 'Tiempo completo' },
    { value: 'part_time', label: 'Medio tiempo' },
    { value: 'temporary', label: 'Temporal' },
    { value: 'permanent', label: 'Permanente' },
  ];
  laborRegimeOptions: SelectOption[] = [
    { value: '', label: 'Todos' },
    { value: 'public', label: 'Público' },
    { value: 'private', label: 'Privado' },
  ];
  workloadTypeOptions: SelectOption[] = [
    { value: '', label: 'Todos' },
    { value: '20_hours', label: '20 horas' },
    { value: '30_hours', label: '30 horas' },
    { value: '40_hours', label: '40 horas' },
  ];
  employmentStatusOptions: SelectOption[] = [
    { value: '', label: 'Todos' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'on_leave', label: 'Licencia' },
  ];
  toolbarMoreItems = computed<DropdownItem[]>(() => [
    {
      label: 'Agregar docente',
      icon: 'fas fa-plus',
      action: () => this.openForm(),
    },
    {
      label: 'Exportar Excel',
      icon: 'fas fa-file-export',
      action: () => this.export(),
    },
    { separator: true, label: 'sep-1' },
    {
      label: 'Asistencias',
      icon: 'fas fa-user-check',
      action: () => this.goToAttendances(),
    },
    {
      label: 'Plantilla Excel',
      icon: 'fas fa-download',
      action: () => this.downloadTemplate(),
    },
    {
      label: 'Importar Excel',
      icon: 'fas fa-file-import',
      action: () => this.openImport(),
    },
  ]);

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const page = Number(query.get('page') ?? 1) || 1;
    const size = Number(query.get('size') ?? this.pagination().size) || this.pagination().size;

    const search = normalizeQueryValue(query.get('search'));
    const contractType = normalizeQueryValue(query.get('contractType'));
    const laborRegime = normalizeQueryValue(query.get('laborRegime'));
    const workloadType = normalizeQueryValue(query.get('workloadType'));
    const employmentStatus = normalizeQueryValue(query.get('employmentStatus'));
    const sortBy = query.get('sortBy');
    const sortOrder = query.get('sortOrder');

    this.currentSearch.set(search);
    this.filterContractType.set(contractType);
    this.filterLaborRegime.set(laborRegime);
    this.filterWorkloadType.set(workloadType);
    this.filterEmploymentStatus.set(employmentStatus);

    if (sortBy && (sortOrder === 'ASC' || sortOrder === 'DESC')) {
      this.currentSort.set({ column: sortBy, direction: sortOrder === 'ASC' ? 'asc' : 'desc' });
    }

    this.loadPage(page, size);
  }

  onRowAction(e: {
    action: { key: string };
    context: { row?: unknown };
  }): void {
    const row = e.context.row as Teacher;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id).subscribe();
  }

  onPageChange(p: { page: number; size: number }): void {
    this.loadPage(p.page, p.size);
  }

  onSearch(term: string): void {
    this.currentSearch.set(term.trim());
    this.loadPage(1, this.pagination().size);
  }

  onRefresh(): void {
    this.loadPage(this.pagination().page, this.pagination().size);
  }

  goToAttendances(): void {
    this.router.navigate(['/teachers/attendances']);
  }

  onFilterContractType(value: unknown): void {
    this.filterContractType.set(normalizeQueryValue(value == null ? null : String(value)));
    this.loadPage(1, this.pagination().size);
  }

  onFilterLaborRegime(value: unknown): void {
    this.filterLaborRegime.set(normalizeQueryValue(value == null ? null : String(value)));
    this.loadPage(1, this.pagination().size);
  }

  onFilterWorkloadType(value: unknown): void {
    this.filterWorkloadType.set(normalizeQueryValue(value == null ? null : String(value)));
    this.loadPage(1, this.pagination().size);
  }

  onFilterEmploymentStatus(value: unknown): void {
    this.filterEmploymentStatus.set(normalizeQueryValue(value == null ? null : String(value)));
    this.loadPage(1, this.pagination().size);
  }

  clearFilters(): void {
    this.filterContractType.set('');
    this.filterLaborRegime.set('');
    this.filterWorkloadType.set('');
    this.filterEmploymentStatus.set('');
    this.loadPage(1, this.pagination().size);
  }

  onSort(sort: DataSourceSorting): void {
    this.currentSort.set(sort);
    this.loadPage(this.pagination().page, this.pagination().size);
  }

  private loadPage(page: number, size: number): void {
    const sort = this.currentSort();
    const params: TeacherParams = {
      page,
      size,
      search: this.currentSearch() || undefined,
      sortBy: sort?.column,
      sortOrder: sort ? (sort.direction === 'asc' ? 'ASC' : 'DESC') : undefined,
      contractType: (this.filterContractType() || undefined) as TeacherParams['contractType'],
      laborRegime: (this.filterLaborRegime() || undefined) as TeacherParams['laborRegime'],
      workloadType: (this.filterWorkloadType() || undefined) as TeacherParams['workloadType'],
      employmentStatus: (this.filterEmploymentStatus() || undefined) as TeacherParams['employmentStatus'],
    };
    this.syncUrl(params);
    this.store.loadAll(params);
  }

  private syncUrl(params: TeacherParams): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: params.search || null,
        page: params.page ?? 1,
        size: params.size ?? this.pagination().size,
        sortBy: params.sortBy || null,
        sortOrder: params.sortOrder || null,
        contractType: params.contractType || null,
        laborRegime: params.laborRegime || null,
        workloadType: params.workloadType || null,
        employmentStatus: params.employmentStatus || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  openForm(current?: Teacher | null): void {
    const ref = this.dialog.open(TeacherForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '720px',
    });

    ref.closed.subscribe(() => this.loadPage(this.pagination().page, this.pagination().size));
  }

  downloadTemplate(): void {
    const blob = this.excel.generateTemplate(
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
      'Docentes',
    );

    this.excel.download(blob, 'plantilla_docentes.xlsx');
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
      panelClass: 'dialog-top',
      width: '720px',
    });

    ref.closed.subscribe(() => this.loadPage(this.pagination().page, this.pagination().size));
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
      const blob = this.excel.generate(EXCEL_COLUMNS, data, 'Docentes');
      this.excel.download(blob, `docentes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}
