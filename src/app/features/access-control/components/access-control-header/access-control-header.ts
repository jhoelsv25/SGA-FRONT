import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';

@Component({
  selector: 'sga-access-control-header',

  imports: [CommonModule, FormsModule, ZardDatePickerComponent],
  templateUrl: './access-control-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessControlHeaderComponent {
  readonly date = input.required<string>();
  readonly entryCount = input<number>(0);
  readonly exitCount = input<number>(0);
  readonly dateChange = output<string | Date | null | undefined>();
}
