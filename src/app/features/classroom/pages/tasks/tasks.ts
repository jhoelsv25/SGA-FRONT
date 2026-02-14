import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-classroom-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tasks {
  public tasks = [
    { id: '1', title: 'Tarea de Álgebra', date: '2023-12-15', status: 'pending', points: 20 },
    { id: '2', title: 'Proyecto Final', date: '2023-12-20', status: 'delivered', points: 100 },
    { id: '3', title: 'Control de Lectura', date: '2023-12-10', status: 'graded', points: 20, grade: 18 },
  ];
}
