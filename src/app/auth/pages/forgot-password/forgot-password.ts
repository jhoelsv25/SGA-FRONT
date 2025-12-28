import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Logo } from '@shared/components/logo/logo';
import { ForgotForm } from "@auth/components/forgot-form/forgot-form";

@Component({
  selector: 'sga-forgot-password',
  imports: [ Logo, ForgotForm],
  templateUrl: './forgot-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ForgotPassword { }
