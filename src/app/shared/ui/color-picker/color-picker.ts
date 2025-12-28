import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sga-color-picker',
  imports: [],
  templateUrl: './color-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPicker { }
