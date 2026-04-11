import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZardCardComponent } from '@/shared/components/card';
import type { ThemeConfig } from '@core/types/layout-types';
import type { SettingsThemeOption } from '../settings.types';

@Component({
  selector: 'sga-settings-appearance-section',
  standalone: true,
  imports: [CommonModule, ZardCardComponent],
  templateUrl: './settings-appearance-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAppearanceSectionComponent {
  readonly currentTheme = input<ThemeConfig>('system');
  readonly themeOptions = input<SettingsThemeOption[]>([]);
  readonly themeChange = output<ThemeConfig>();
}
