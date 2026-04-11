import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZardCardComponent } from '@/shared/components/card';
import type { SettingsNotificationItem, SettingsPreferenceKey } from '../settings.types';

@Component({
  selector: 'sga-settings-notifications-section',
  standalone: true,
  imports: [CommonModule, ZardCardComponent],
  templateUrl: './settings-notifications-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsNotificationsSectionComponent {
  readonly notificationRows = input<SettingsNotificationItem[]>([]);
  readonly preferences = input<Partial<Record<SettingsPreferenceKey, boolean>>>({});
  readonly preferenceStatus = input<string>('Sincronizado');
  readonly showTeacherReminderConfig = input<boolean>(false);
  readonly showGlobalReminderConfig = input<boolean>(false);
  readonly liveClassReminderEnabled = input<boolean>(true);
  readonly liveClassReminderLeadMinutes = input<number>(5);
  readonly globalLiveClassReminderEnabled = input<boolean>(true);
  readonly globalLiveClassReminderLeadMinutes = input<number>(5);
  readonly liveClassReminderPresets = input<readonly number[]>([]);
  readonly reminderLeadLabel = input<(minutes: number) => string>(() => '');

  readonly preferenceToggle = output<SettingsPreferenceKey>();
  readonly liveReminderToggle = output<void>();
  readonly liveReminderLeadChange = output<number>();
  readonly globalReminderToggle = output<void>();
  readonly globalReminderLeadChange = output<number>();
}
