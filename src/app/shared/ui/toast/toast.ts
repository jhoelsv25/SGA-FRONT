import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'sga-toast',
  imports: [NgxSonnerToaster],
  template: `
    <ngx-sonner-toaster
      position="top-right"
      [richColors]="true"
      [closeButton]="true"
      [expand]="true"
      [theme]="'system'"
      [duration]="4000"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {}
