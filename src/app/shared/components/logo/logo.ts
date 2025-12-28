import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sga-logo',
  template:`
    <a href="/">
      <img src="logo.jpeg" alt="Logo" class="h-12 mr-2" />
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo { }
