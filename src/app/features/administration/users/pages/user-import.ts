import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { Router, RouterLink } from '@angular/router';

import { UserImportDropzone } from '../components/user-import-dropzone/user-import-dropzone';

@Component({
  selector: 'sga-user-import',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    RouterLink,
    UserImportDropzone,
  ],
  templateUrl: './user-import.html',
  styles: [
    `
      :host {
        display: block;
        background: radial-gradient(circle at top right, var(--primary-muted), transparent 40%);
        min-height: 100vh;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserImportPage {
  private router = inject(Router);

  public selectedFile = signal<File | null>(null);
  public isUploading = signal(false);

  onFileSelected(file: File) {
    this.selectedFile.set(file);
  }

  importUsers() {
    if (!this.selectedFile()) return;
    this.isUploading.set(true);
    // Simulate upload
    setTimeout(() => {
      this.isUploading.set(false);
      this.router.navigate(['/administration/users']);
    }, 2000);
  }

  onCancel() {
    this.selectedFile.set(null);
  }
}
