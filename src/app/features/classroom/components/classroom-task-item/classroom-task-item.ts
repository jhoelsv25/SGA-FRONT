import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ClassroomApi, type ClassroomTask } from '../../services/classroom-api';
import { Toast } from '@core/services/toast';

@Component({
  selector: 'sga-classroom-task-item',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './classroom-task-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTaskItem {
  public task = input.required<ClassroomTask>();
  public sectionCourseId = input.required<string>();
  public canCreateTask = input<boolean>(false);
  public canSubmitTask = input<boolean>(false);
  public canInspectStudentSubmissions = input<boolean>(false);
  public canReviewTask = input<boolean>(false);
  public canCommentTask = input<boolean>(false);
  public profileType = input<string>('user');
  public currentUserId = input<string | null>(null);

  public onEdit = output<string>();
  public onDelete = output<ClassroomTask>();
  public onRefresh = output<void>();

  private readonly api = inject(ClassroomApi);
  private readonly toast = inject(Toast);

  statusLabel(status: ClassroomTask['status']) {
    if (status === 'graded') return 'Calificado';
    if (status === 'delivered') return 'Entregado';
    if (status === 'late') return 'Tardio';
    return 'Pendiente';
  }

}
