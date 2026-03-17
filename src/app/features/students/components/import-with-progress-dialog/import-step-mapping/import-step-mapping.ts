import { ZardButtonComponent } from '@/shared/components/button';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FieldOption {
  key: string;
  label: string;
  required: boolean;
}


@Component({
  selector: 'sga-import-step-mapping',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent],
  templateUrl: './import-step-mapping.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStepMapping {
  fieldOptions = input.required<readonly FieldOption[]>();
  headers = input.required<string[]>();
  rowCount = input(0);
  getMapping = input.required<(field: string) => string>();
  canStartImport = input(false);

  mappingChange = output<{ field: string; header: string }>();
  startImport = output<void>();
  cancelled = output<void>();

  setMapping(field: string, header: string): void {
    this.mappingChange.emit({ field, header });
  }

  onStartImport(): void {
    this.startImport.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
