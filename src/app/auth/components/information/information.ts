import { Component } from '@angular/core';
import { Logo } from '@shared/widgets/logo/logo';
import { ZardIconComponent } from '@shared/components/icon';

@Component({
  selector: 'sga-information',
  imports: [Logo, ZardIconComponent],
  templateUrl: './information.html',
})
export class Information {

}
