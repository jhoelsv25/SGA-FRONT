import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';
import { CourseStore } from '../../services/store/course.store';
import type { Course } from '../../types/course-types';
import { CourseForm } from '../../components/course-form/course-form';

@Component({
  selector: 'sga-courses',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Courses implements OnInit {
  public readonly store = inject(CourseStore);
  private readonly dialog = inject(Dialog);

  ngOnInit(): void {
    this.store.loadAll({});
  }

  openForm(current?: Course | null): void {
    this.dialog.open(CourseForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
    });
  }
}
