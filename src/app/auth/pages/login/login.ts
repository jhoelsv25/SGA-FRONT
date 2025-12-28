
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoginForm } from '@auth/components/login-form/login-form';
import { Logo } from '@shared/components/logo/logo';

@Component({
  selector: 'sga-login',
  imports: [LoginForm, Logo],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login { }
