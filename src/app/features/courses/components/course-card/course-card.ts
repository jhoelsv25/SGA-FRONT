import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { SgaHasPermissionDirective } from '@/shared/core/directives/permission/has-permission.directive';
import { SgaDisableIfNoPermissionDirective } from '@/shared/core/directives/permission/disable-if-no-permission.directive';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Course } from '../../types/course-types';

@Component({
  selector: 'sga-course-card',

  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
    SgaHasPermissionDirective,
    SgaDisableIfNoPermissionDirective,
  ],
  templateUrl: './course-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  course = input.required<Course>();
  canManage = input<boolean>(true);
  edit = output<Course>();
  delete = output<Course>();
  viewSections = output<Course>();
  viewCompetencies = output<Course>();
  viewSchedules = output<Course>();
}
