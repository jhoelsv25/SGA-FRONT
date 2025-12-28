import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
interface AlertAction {
  label: string;
  action: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}

@Component({
  selector: 'sga-alert',
  imports: [NgClass],
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  public type = input<'success' | 'info' | 'warning' | 'danger' | 'primary' | 'custom'>();
  public title = input<string>();
  public message = input<string>();
  public icon = input<string>();
  public actions = input<AlertAction[]>([]);
  public changeAction = output<void>();

  public handleAction(action: () => void) {
    action();
  }
}
