import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'sga-card',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    'class': 'rounded-xl border border-base-200 bg-base-100 text-base-content shadow-sm block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {}

@Component({
  selector: 'sga-card-header',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    'class': 'flex flex-col space-y-1.5 p-6 block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeader {}

@Component({
  selector: 'sga-card-title',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    'class': 'text-2xl font-semibold leading-none tracking-tight block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTitle {}

@Component({
  selector: 'sga-card-description',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    'class': 'text-sm text-base-content/60 block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDescription {}

@Component({
  selector: 'sga-card-content',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    'class': 'p-6 pt-0 block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardContent {}

@Component({
  selector: 'sga-card-footer',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    'class': 'flex items-center p-6 pt-0 block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFooter {}
