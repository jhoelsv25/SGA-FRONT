import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sga-skeleton',
  imports: [],
  templateUrl: './skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton { }
