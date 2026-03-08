import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-import-step-upload',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './import-step-upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStepUpload {
  isDragging = input(false);
  file = input<File | null>(null);
  loading = input(false);

  fileSelected = output<Event>();
  dragOver = output<DragEvent>();
  dragLeave = output<DragEvent>();
  fileDropped = output<DragEvent>();
  downloadTemplate = output<void>();

  onFileSelected(e: Event): void {
    this.fileSelected.emit(e);
  }

  onDragOver(e: DragEvent): void {
    this.dragOver.emit(e);
  }

  onDragLeave(e: DragEvent): void {
    this.dragLeave.emit(e);
  }

  onDrop(e: DragEvent): void {
    this.fileDropped.emit(e);
  }

  onDownloadTemplate(): void {
    this.downloadTemplate.emit();
  }
}
