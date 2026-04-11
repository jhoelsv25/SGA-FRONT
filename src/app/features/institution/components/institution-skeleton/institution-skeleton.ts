import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sga-institution-skeleton',

  templateUrl: './institution-skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionSkeleton {
  readonly items = [1, 2, 3, 4];
}
