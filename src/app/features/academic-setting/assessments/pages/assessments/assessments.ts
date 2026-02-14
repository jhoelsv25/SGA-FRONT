import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentStore } from '../../services/store/assessment.store';

@Component({
  selector: 'sga-assessments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessments.html',
  styleUrl: './assessments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Assessments implements OnInit {
  public readonly store = inject(AssessmentStore);

  ngOnInit() {
    this.store.loadAll({});
  }
}
