import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZardCardComponent } from '@/shared/components/card';
import type { SettingsAuditRow } from '../settings.types';

@Component({
  selector: 'sga-settings-logs-section',
  standalone: true,
  imports: [CommonModule, ZardCardComponent],
  templateUrl: './settings-logs-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsLogsSectionComponent {
  readonly loading = input<boolean>(false);
  readonly auditRows = input<SettingsAuditRow[]>([]);
}
