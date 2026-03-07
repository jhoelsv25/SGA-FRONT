import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'sga-card',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    'class': 'rounded-4xl border border-base-200 bg-base-100 text-base-content shadow-sm block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {}
