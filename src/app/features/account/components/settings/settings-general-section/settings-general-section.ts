import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardCardComponent } from '@/shared/components/card';
import type { SettingsInfoRow } from '../settings.types';

@Component({
  selector: 'sga-settings-general-section',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardCardComponent],
  templateUrl: './settings-general-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralSectionComponent {
  readonly loading = input<boolean>(false);
  readonly generalRows = input<SettingsInfoRow[]>([]);
  readonly roleRows = input<SettingsInfoRow[]>([]);
}
