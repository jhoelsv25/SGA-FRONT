import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sga-home',
  imports: [],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
