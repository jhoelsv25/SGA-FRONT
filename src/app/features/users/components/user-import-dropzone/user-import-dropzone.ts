import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';

@Component({
  selector: 'sga-user-import-dropzone',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardCardComponent, ZardIconComponent],
  templateUrl: './user-import-dropzone.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserImportDropzone {
  isUploading = input<boolean>(false);

  fileSelected = output<File>();
  importRequested = output<void>();
  cancelRequested = output<void>();

  public fileName = signal<string | null>(null);
  public isDragging = signal(false);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File) {
    if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      this.fileName.set(file.name);
      this.fileSelected.emit(file);
    } else {
      alert('Solo se permiten archivos CSV o Excel');
    }
  }

  onImport() {
    this.importRequested.emit();
  }

  onCancel() {
    this.fileName.set(null);
    this.cancelRequested.emit();
  }
}
