import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

const STEPS = [
  { id: 'upload', label: 'Archivo', icon: 'fa-cloud-upload-alt' },
  { id: 'mapping', label: 'Mapeo', icon: 'fa-columns' },
  { id: 'importing', label: 'Importando', icon: 'fa-spinner' },
  { id: 'done', label: 'Listo', icon: 'fa-check-circle' }] as const;


@Component({
  selector: 'sga-import-step-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-step-indicator.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStepIndicator {
  currentStep = input.required<'upload' | 'mapping' | 'importing' | 'done'>();
  steps = STEPS;
}
