import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

  public tasks = signal<ClassroomTask[]>([]);

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
