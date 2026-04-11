import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZardCardComponent } from '@/shared/components/card';
import type { AccountEmailLog } from '@auth/types/auth-type';
import type { SettingsInfoRow } from '../settings.types';

@Component({
  selector: 'sga-settings-email-section',
  standalone: true,
  imports: [CommonModule, ZardCardComponent],
  templateUrl: './settings-email-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsEmailSectionComponent {
  readonly emailRows = input<SettingsInfoRow[]>([]);
  readonly loadingEmailLogs = input<boolean>(false);
  readonly userEmailLogs = input<AccountEmailLog[]>([]);
  readonly formatDate = input<(value?: string | null, fallback?: string) => string>(() => '');
}
