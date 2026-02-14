import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseStore } from '../../services/store/course.store';

@Component({
  selector: 'sga-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Courses implements OnInit {
  public readonly store = inject(CourseStore);

  ngOnInit() {
    this.store.loadAll({});
  }
}
