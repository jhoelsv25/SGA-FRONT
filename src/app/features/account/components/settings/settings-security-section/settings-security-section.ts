import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardCardComponent } from '@/shared/components/card';
import type { SettingsStatusRow } from '../settings.types';

@Component({
  selector: 'sga-settings-security-section',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardCardComponent],
  templateUrl: './settings-security-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSecuritySectionComponent {
  readonly securityRows = input<SettingsStatusRow[]>([]);
}
