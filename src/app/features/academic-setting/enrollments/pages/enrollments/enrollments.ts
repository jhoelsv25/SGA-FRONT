import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { EnrollmentStore } from '../../services/store/enrollment.store';

@Component({
  selector: 'sga-enrollments',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './enrollments.html',
  styleUrl: './enrollments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Enrollments implements OnInit {
  public readonly store = inject(EnrollmentStore);

  ngOnInit() {
    this.store.loadAll({});
  }
}
