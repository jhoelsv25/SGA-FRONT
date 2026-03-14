import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Button } from '@shared/directives';
import { Input } from '@shared/adapters/ui/input/input';

@Component({
  selector: 'sga-login-form',
  imports: [ReactiveFormsModule, NgClass, RouterLinkWithHref, Button, Input],
  templateUrl: './login-form.html',
})
export class LoginForm {
  private authFacade = inject(AuthFacade);
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

    this.authFacade.login(credentials).subscribe({
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
