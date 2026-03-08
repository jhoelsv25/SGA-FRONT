import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';

export interface ImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

@Component({
  selector: 'sga-import-step-done',
  standalone: true,
  imports: [CommonModule, Button],
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
