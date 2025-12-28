import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'sga-user-form',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private readonly fb = inject(FormBuilder);

  public userForm: FormGroup;

  constructor() {
    this.userForm = this.fb.group({
      name: [''],
      email: [''],
      role: [''],
    });
  }
}
