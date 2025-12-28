import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Information } from '@auth/components/information/information';
import { CopyRight } from '@shared/components/copy-righ/copy-righ';

@Component({
  selector: 'sga-home',
  imports: [RouterOutlet, Information, CopyRight],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  public time = new Date();
}
