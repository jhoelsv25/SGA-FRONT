import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { SettingsHeroPill, SettingsSectionId, SettingsSectionItem } from '../settings.types';

@Component({
  selector: 'sga-settings-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsHeroComponent {
  readonly roleBadge = input<string>('Perfil');
  readonly pills = input<SettingsHeroPill[]>([]);
  readonly sections = input<SettingsSectionItem[]>([]);
  readonly activeSection = input<SettingsSectionId>('general');
  readonly sectionChange = output<SettingsSectionId>();
}
