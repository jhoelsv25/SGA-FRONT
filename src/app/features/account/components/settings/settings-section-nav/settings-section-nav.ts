import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZardCardComponent } from '@/shared/components/card';
import type { SettingsSectionId, SettingsSectionItem } from '../settings.types';

@Component({
  selector: 'sga-settings-section-nav',
  standalone: true,
  imports: [CommonModule, ZardCardComponent],
  templateUrl: './settings-section-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSectionNavComponent {
  readonly sections = input<SettingsSectionItem[]>([]);
  readonly activeSection = input<SettingsSectionId>('general');
  readonly sectionChange = output<SettingsSectionId>();
}
