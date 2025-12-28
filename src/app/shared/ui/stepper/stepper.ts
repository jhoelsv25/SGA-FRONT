import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
export interface Step {
  label: string;
  completed?: boolean;
}
@Component({
  selector: 'sga-stepper',
  imports: [],
  templateUrl: './stepper.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stepper {
  steps = input<Step[]>([]);
  currentStep = signal(0);

  stepChange = output<number>();
  completed = output<void>();

  isFirst = computed(() => this.currentStep() === 0);
  isLast = computed(() => this.currentStep() === this.steps().length - 1);

  goTo(stepIndex: number) {
    this.currentStep.set(stepIndex);
    this.stepChange.emit(stepIndex);
  }

  next() {
    if (!this.isLast()) {
      this.goTo(this.currentStep() + 1);
    } else {
      this.completed.emit();
    }
  }

  prev() {
    if (!this.isFirst()) {
      this.goTo(this.currentStep() - 1);
    }
  }
}
