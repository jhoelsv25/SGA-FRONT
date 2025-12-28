import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterField } from '@core/types/filter-types';
import { Button } from '@shared/directives';
import { DatePicker } from '@shared/ui/date-picker/date-picker';
import { Select } from '@shared/ui/select/select';

@Component({
  selector: 'sga-filter-dialog',
  imports: [CommonModule, FormsModule, Select, DatePicker, Button],
  templateUrl: './filter-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDialog {
  // Inputs
  fields = input.required<FilterField[]>();
  currentFilters = input<Record<string, unknown>>({});
  isOpen = input<boolean>(false);

  // Outputs
  filterChange = output<{ key: string; value: unknown }>();
  clearFilters = output<void>();
  closeDialog = output<void>();
  apply = output<void>();

  // Métodos
  onFilterChange(key: string, value: unknown): void {
    this.filterChange.emit({ key, value });
  }

  onDateRangeChange(fieldKey: string, part: 'from' | 'to', value: string): void {
    const current = (this.currentFilters()[fieldKey] as Record<string, string> | undefined) || {};
    const updated = { ...current, [part]: value };

    if (!updated['from'] && !updated['to']) {
      this.onFilterChange(fieldKey, null);
    } else {
      this.onFilterChange(fieldKey, updated);
    }
  }

  onClear(): void {
    this.clearFilters.emit();
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  onApply(): void {
    this.apply.emit();
  }

  // Helper para contar filtros activos
  get activeCount(): number {
    const filters = this.currentFilters();
    return Object.keys(filters).filter((key) => {
      const value = filters[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
  }
}
