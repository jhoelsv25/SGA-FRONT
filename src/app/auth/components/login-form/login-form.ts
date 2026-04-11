import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Component, inject, signal, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { ZardIconComponent } from '@shared/components/icon';

@Component({
  selector: 'sga-login-form',
  imports: [
    ReactiveFormsModule,
    RouterLinkWithHref,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCheckboxComponent,
    ZardIconComponent,
  ],
  templateUrl: './login-form.html',
})
export class LoginForm {
  private authFacade = inject(AuthFacade);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  public showPassword = signal<boolean>(false);
  public loginForm: FormGroup;
  public rememberUser = false;
  public isLoading = signal<boolean>(false);
  public loginError = signal<string | null>(null);

  constructor() {
    const savedUser = localStorage.getItem('remembered-username') || '';
    this.rememberUser = !!savedUser;
    this.loginForm = this.fb.group({
      username: [savedUser, [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  public togglePassword() {
    this.showPassword.update((prev) => !prev);
  }

  onRememberUserChange(checked: boolean) {
    this.rememberUser = checked;
    if (!checked) {
      localStorage.removeItem('remembered-username');
    }
  }

  singIn() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value;
    if (this.rememberUser) {
      localStorage.setItem('remembered-username', credentials.username);
    } else {
      localStorage.removeItem('remembered-username');
    }

    this.isLoading.set(true);
    this.loginError.set(null);

    const redirectTo = this.route.snapshot.queryParamMap.get('redirect');

    this.authFacade.login(credentials, redirectTo || undefined).subscribe({
      next: (response) => {
        if (!response) {
          this.loginError.set('No se pudo iniciar sesion con las credenciales ingresadas.');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.loginError.set('Ocurrio un error al iniciar sesion.');
        this.isLoading.set(false);
      },
    });
  }
}
