import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZardCardComponent } from '@/shared/components/card';
import type { AccountSession } from '@auth/types/auth-type';
import type { SettingsInfoRow } from '../settings.types';

@Component({
  selector: 'sga-settings-sessions-section',
  standalone: true,
  imports: [CommonModule, ZardCardComponent],
  templateUrl: './settings-sessions-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSessionsSectionComponent {
  readonly sessionRows = input<SettingsInfoRow[]>([]);
  readonly loadingSessions = input<boolean>(false);
  readonly userSessions = input<AccountSession[]>([]);
  readonly isSessionActive = input<(session: AccountSession) => boolean>(() => false);
  readonly formatDate = input<(value?: string | null, fallback?: string) => string>(() => '');
  readonly revokeSession = output<string>();
}
