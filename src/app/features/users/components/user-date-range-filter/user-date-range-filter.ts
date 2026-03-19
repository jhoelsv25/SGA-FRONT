import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { ZardFormImports } from '@/shared/components/form';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';

export type UserDatePreset = '7d' | '30d' | 'custom' | '';

@Component({
  selector: 'sga-user-date-range-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardDatePickerComponent, SelectOptionComponent, ...ZardFormImports],
  template: `
    <div class="flex flex-col gap-4">
      <z-form-field>
        <label z-form-label>Rango</label>
        <z-form-control>
          <z-select-option
            [options]="presetOptions"
            [ngModel]="preset()"
            (ngModelChange)="selectPreset($event)"
            placeholder="Seleccionar rango"
            customClass="w-full"
          />
        </z-form-control>
      </z-form-field>

      @if (preset() === 'custom') {
        <div class="flex flex-col gap-3">
          <z-form-field>
            <label z-form-label>Desde</label>
            <z-form-control>
              <z-date-picker
                [ngModel]="fromDate()"
                (ngModelChange)="onFromDateChange($event)"
                [placeholder]="'Seleccionar fecha inicial'"
                class="w-full"
              />
            </z-form-control>
          </z-form-field>

          <z-form-field>
            <label z-form-label>Hasta</label>
            <z-form-control>
              <z-date-picker
                [ngModel]="toDate()"
                (ngModelChange)="onToDateChange($event)"
                [placeholder]="'Seleccionar fecha final'"
                class="w-full"
              />
            </z-form-control>
          </z-form-field>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDateRangeFilterComponent {
  readonly preset = model<UserDatePreset>('');
  readonly fromDate = model<Date | null>(null);
  readonly toDate = model<Date | null>(null);
  readonly rangeChange = output<{ preset: UserDatePreset; from: Date | null; to: Date | null }>();
  readonly disabled = input(false);

  readonly presetOptions: { value: UserDatePreset; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: 'custom', label: 'Personalizado' },
  ];

  selectPreset(value: UserDatePreset): void {
    if (this.disabled()) return;
    this.preset.set(value);

    if (value === '7d' || value === '30d') {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (value === '7d' ? 6 : 29));
      this.fromDate.set(from);
      this.toDate.set(to);
    }

    if (value === '') {
      this.fromDate.set(null);
      this.toDate.set(null);
    }

    this.emitChange();
  }

  onFromDateChange(value: Date | null): void {
    this.fromDate.set(value);
    this.emitChange();
  }

  onToDateChange(value: Date | null): void {
    this.toDate.set(value);
    this.emitChange();
  }

  private emitChange(): void {
    this.rangeChange.emit({
      preset: this.preset(),
      from: this.fromDate(),
      to: this.toDate(),
    });
  }
}
