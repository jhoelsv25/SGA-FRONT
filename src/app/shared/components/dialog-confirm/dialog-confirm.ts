import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogTypeOptions } from '@core/types/dialog-types';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-dialog-confirm',
  imports: [FormsModule, Button],
  templateUrl: './dialog-confirm.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogConfirm {
  public data = input.required<DialogTypeOptions>();
  public options = signal<DialogTypeOptions>({
    type: 'danger',
    title: 'Confirmación',
    icon: 'info-circle',
    message: '¿Estás seguro de continuar?',
    rejectButtonProps: {
      label: 'Cancelar',
      color: 'primary',
      variant: 'outline',
      size: 'md',
    },
    acceptButtonProps: {
      label: 'Aceptar',
      color: 'primary',
      variant: 'solid',
      size: 'md',
    },
    showInput: false,
    inputLabel: '',
    inputPlaceholder: '',
  });
  public confirmed = output<string | boolean>();
  public rejected = output<void>();

  public userInput = signal('');

  public onAccept() {
    const trimmed = this.userInput().trim();
    const value = this.options().showInput ? trimmed : true;
    this.confirmed.emit(value);
    this.options().onAccept?.(this.options().showInput ? trimmed : undefined);
  }

  public onReject() {
    this.rejected.emit();
    this.options().onReject?.();
  }
}
