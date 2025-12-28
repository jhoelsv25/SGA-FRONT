import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
@Component({
  selector: 'sga-login-form',
  imports: [ReactiveFormsModule, NgClass, RouterLinkWithHref],
  templateUrl: './login-form.html',
})
export class LoginForm {
  private authFacade = inject(AuthFacade);
  private fb = inject(FormBuilder);
  public showPassword = signal<boolean>(false);
  public loginForm: FormGroup;
  public rememberUser = false;
  public isLoading = signal<boolean>(false);

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
    if (this.loginForm.invalid) return;

    const credentials = this.loginForm.value;
    if (this.rememberUser) {
      localStorage.setItem('remembered-username', credentials.username);
    } else {
      localStorage.removeItem('remembered-username');
    }

    this.isLoading.set(true);

    this.authFacade.login(credentials).subscribe((response) => {
      console.log('Login successful', response);
      this.isLoading.set(false);
    });
  }
}
