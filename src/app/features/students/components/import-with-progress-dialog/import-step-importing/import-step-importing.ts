import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-import-step-importing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-step-importing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStepImporting {
  progress = input<{
    processed: number;
    total: number;
    percentage: number;
    created: number;
  } | null>(null);
}
