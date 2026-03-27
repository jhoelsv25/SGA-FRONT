import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { ZardButtonComponent } from '@/shared/components/button';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentStore } from '../../services/store/assessment.store';
import { AssessmentFiltersService } from '../../services/assessment-filters.service';
import { AssessmentCardComponent } from '../../components/assessment-card/assessment-card';
import { Router } from '@angular/router';
import type { Assessment } from '../../types/assessment-types';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { AssessmentForm } from '../../components/assessment-form/assessment-form';
import { AssessmentApi } from '../../services/assessment-api';
import { Toast } from '@core/services/toast';
import { AuthStore } from '@auth/services/store/auth.store';

@Component({
  selector: 'sga-assessments',
  standalone: true,
  imports: [CommonModule, ListToolbarComponent, ZardButtonComponent, AssessmentCardComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './assessments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Assessments implements OnInit {
  private readonly store = inject(AssessmentStore);
  private readonly filters = inject(AssessmentFiltersService);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogModalService);
  private readonly confirm = inject(DialogConfirmService);
  private readonly api = inject(AssessmentApi);
  private readonly toast = inject(Toast);
  private readonly authStore = inject(AuthStore);

  roleType = computed(() => this.authStore.currentUser()?.profile?.type ?? 'user');

  data = computed(() =>
    this.store.assessments().filter((assessment) => {
      const search = this.filters.listSearch().trim().toLowerCase();
      if (!search) return true;
      return [
        assessment.name,
        assessment.status,
        assessment.type,
        assessment.period?.name,
        assessment.sectionCourse?.course?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    }),
  );
  loading = computed(() => this.store.loading());
  totalAssessments = computed(() => this.data().length);
  hasListSearch = computed(() => Boolean(this.filters.listSearch()));
  completedCount = computed(() => this.data().filter((item) => item.status === 'completed').length);
  pendingCount = computed(() => this.data().filter((item) => item.status === 'pending').length);
  reviewedCount = computed(() => this.data().filter((item) => item.status === 'reviewed').length);
  pageTitle = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Mis evaluaciones';
      case 'student':
        return 'Evaluaciones';
      case 'guardian':
        return 'Evaluaciones del hogar';
      default:
        return 'Evaluaciones';
    }
  });
  pageDescription = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Administra evaluaciones, pesos y seguimiento de tus aulas asignadas.';
      case 'student':
        return 'Consulta evaluaciones, estados y progreso académico de tus cursos.';
      case 'guardian':
        return 'Revisa el avance evaluativo y el estado académico de tus estudiantes vinculados.';
      default:
        return 'Gestión de evaluaciones y criterios de calificación.';
    }
  });
  pageSummary = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Organiza evaluaciones, pesos y fechas de tus aulas en un solo lugar.';
      case 'student':
        return 'Consulta las evaluaciones registradas y su estado actual.';
      case 'guardian':
        return 'Sigue las evaluaciones registradas para tus estudiantes vinculados.';
      default:
        return 'Administra evaluaciones, pesos y fechas en un solo lugar.';
    }
  });
  searchPlaceholder = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Buscar por evaluación, período o curso...';
      case 'student':
        return 'Buscar por evaluación o estado...';
      case 'guardian':
        return 'Buscar por evaluación o estudiante...';
      default:
        return 'Buscar por nombre o estado...';
    }
  });
  createLabel = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Crear evaluación';
      default:
        return 'Nueva Evaluación';
    }
  });
  pendingDescription = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Evaluaciones que aún requieren registro o avance';
      case 'student':
        return 'Evaluaciones que todavía siguen en proceso';
      case 'guardian':
        return 'Evaluaciones del hogar aún en proceso';
      default:
        return 'Evaluaciones por completar';
    }
  });
  completedDescription = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Con resultados y calificaciones ya registradas';
      case 'student':
        return 'Evaluaciones ya calificadas';
      case 'guardian':
        return 'Evaluaciones con resultados ya publicados';
      default:
        return 'Con calificaciones registradas';
    }
  });
  reviewedDescription = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Listas para cierre, revisión o consulta';
      case 'student':
        return 'Listas para consulta académica';
      case 'guardian':
        return 'Listas para seguimiento familiar';
      default:
        return 'Listas para consulta';
    }
  });
  emptyTitle = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Sin evaluaciones en tus aulas';
      case 'student':
        return 'Sin evaluaciones disponibles';
      case 'guardian':
        return 'Sin evaluaciones del hogar';
      default:
        return 'Sin evaluaciones';
    }
  });
  emptyDescription = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'No se encontraron evaluaciones con los filtros actuales para tus aulas asignadas.';
      case 'student':
        return 'No se encontraron evaluaciones con los filtros actuales.';
      case 'guardian':
        return 'No se encontraron evaluaciones para tus estudiantes vinculados con los filtros actuales.';
      default:
        return 'No se encontraron evaluaciones con los filtros actuales.';
    }
  });

  ngOnInit() {
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  onSearch(value: string): void {
    this.filters.setListSearch(value);
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  onCreate(): void {
    this.openForm();
  }

  clearFilters(): void {
    this.filters.clearListFilters();
    this.store.loadAll({});
  }

  onRefresh() {
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  viewDetail(assessment: Assessment): void {
    this.router.navigate(['/assessments', assessment.id], {
      state: { assessment },
    });
  }

  viewScores(assessment: Assessment): void {
    this.router.navigate(['/assessments/scores'], {
      queryParams: { sectionCourse: assessment.sectionCourse.id },
    });
  }

  viewGrades(assessment: Assessment): void {
    this.router.navigate(['/assessments/grades'], {
      queryParams: { assessmentId: assessment.id },
    });
  }

  editAssessment(assessment: Assessment): void {
    this.openForm(assessment);
  }

  deleteAssessment(assessment: Assessment): void {
    this.confirm.open({
      title: 'Eliminar evaluación',
      message: `Se eliminará "${assessment.name}". Esta acción no se puede deshacer.`,
      icon: 'fas fa-triangle-exclamation',
      type: 'danger',
      acceptButtonProps: { label: 'Eliminar' },
      rejectButtonProps: { label: 'Cancelar' },
      onAccept: () => {
        this.api.delete(assessment.id).subscribe({
          next: () => {
            this.toast.success('Evaluación eliminada correctamente');
            this.onRefresh();
          },
          error: (error) => {
            this.toast.error('Error al eliminar evaluación: ' + (error?.message || 'intenta nuevamente'));
          },
        });
      },
    });
  }

  private openForm(current?: Assessment): void {
    this.dialog
      .open(AssessmentForm, {
        data: { current: current ?? null },
        width: '920px',
        maxHeight: '85vh',
      })
      .closed.subscribe((saved) => {
        if (saved) this.onRefresh();
      });
  }
}
