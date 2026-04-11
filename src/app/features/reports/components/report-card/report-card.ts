import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import { SgaDisableIfNoPermissionDirective } from '@/shared/core/directives/permission/disable-if-no-permission.directive';
import { SgaHasPermissionDirective } from '@/shared/core/directives/permission/has-permission.directive';
import type { Report, ReportMeta } from '../../types/report-types';

@Component({
  selector: 'sga-report-card',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
    SgaHasPermissionDirective,
    SgaDisableIfNoPermissionDirective,
  ],
  templateUrl: './report-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCardComponent {
  report = input.required<Report>();

  viewDetail = output<Report>();
  edit = output<Report>();
  delete = output<Report>();
  download = output<Report>();

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      academic: 'Académico',
      attendance: 'Asistencia',
      payments: 'Pagos',
      behavior: 'Conducta',
      enrollment: 'Matrículas',
      custom: 'Personalizado',
      other: 'Otro',
    };
    return map[this.report().type] ?? this.report().type;
  });

  readonly formatLabel = computed(() => {
    const map: Record<string, string> = {
      pdf: 'PDF',
      xlsx: 'Excel',
      csv: 'CSV',
    };
    return map[this.report().format ?? ''] ?? (this.report().format || 'Sin formato');
  });

  readonly statusMeta = computed(
    () => ((this.report().parameters ?? {})['__meta'] ?? {}) as ReportMeta,
  );
}
