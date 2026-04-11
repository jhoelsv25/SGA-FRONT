import { ZardButtonComponent } from '@/shared/components/button';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

@Component({
  selector: 'sga-import-step-done',

  imports: [CommonModule, ZardButtonComponent],
  templateUrl: './import-step-done.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStepDone {
  result = input.required<ImportResult>();

  closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
