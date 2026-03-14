import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi, type ClassroomTask } from '../../services/classroom-api';

@Component({
  selector: 'sga-classroom-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tasks implements OnInit {
  private store = inject(ClassroomStore);
  private api = inject(ClassroomApi);
  private readonly route = inject(ActivatedRoute);
  private readonly authFacade = inject(AuthFacade);

  public tasks = signal<ClassroomTask[]>([]);
  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly canInspectStudentSubmissions = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director' || type === 'guardian';
  });
  readonly pageLabel = computed(() => {
    const type = this.profileType();
    if (type === 'student') return 'Tus tareas publicadas para este curso.';
    if (type === 'guardian') return 'Tareas visibles para los estudiantes vinculados.';
    return 'Vista general de tareas publicadas en el aula.';
  });

  statusLabel(status: ClassroomTask['status']) {
    if (status === 'graded') return 'Calificado';
    if (status === 'delivered') return 'Entregado';
    if (status === 'late') return 'Tardio';
    return 'Pendiente';
  }

  ngOnInit(): void {
    const id =
      this.store.selectedSectionId() ??
      (this.route.parent?.snapshot?.paramMap?.get('id') ?? '');

    if (id) {
      this.api.getTasks(id).subscribe({
        next: (list) => this.tasks.set(Array.isArray(list) ? list : []),
        error: () => this.tasks.set([]),
      });
    } else {
      this.tasks.set([]);
    }
  }
}
