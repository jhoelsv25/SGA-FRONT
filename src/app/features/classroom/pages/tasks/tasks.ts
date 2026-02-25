import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi, type ClassroomTask } from '../../services/classroom-api';

const MOCK_TASKS: ClassroomTask[] = [
  { id: '1', title: 'Tarea de Álgebra', date: '2023-12-15', status: 'pending', points: 20 },
  { id: '2', title: 'Proyecto Final', date: '2023-12-20', status: 'delivered', points: 100 },
  { id: '3', title: 'Control de Lectura', date: '2023-12-10', status: 'graded', points: 20, grade: 18 },
];

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

  public tasks = signal<ClassroomTask[]>([]);

  ngOnInit(): void {
    const id = this.store.selectedSectionId();
    if (id) {
      this.api.getTasks(id).subscribe({
        next: (list) => this.tasks.set(Array.isArray(list) ? list : []),
        error: () => this.tasks.set(MOCK_TASKS),
      });
    } else {
      this.tasks.set(MOCK_TASKS);
    }
  }
}
