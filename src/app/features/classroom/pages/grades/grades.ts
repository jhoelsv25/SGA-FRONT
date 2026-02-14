import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-classroom-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Grades {
  public records = [
    { name: 'Práctica Calificada 1', date: '2023-11-20', score: 18, total: 20 },
    { name: 'Examen Mensual', date: '2023-11-25', score: 15, total: 20 },
    { name: 'Participación en Clase', date: '2023-11-30', score: 20, total: 20 },
    { name: 'Trabajo de Investigación', date: '2023-12-05', score: 14, total: 20 },
  ];

  public get average() {
    return this.records.reduce((acc, curr) => acc + curr.score, 0) / this.records.length;
  }
}
