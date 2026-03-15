import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BiometricConfigApi, type BiometricConfig, type BiometricStatus } from '@features/administration/services/api/biometric-config-api';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { Input } from '@shared/adapters/ui/input/input';
import { Checkbox } from '@shared/widgets/ui/checkbox/checkbox';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-biometric-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderDetail, Input, Checkbox, Button],
  templateUrl: './biometric-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BiometricConfigPage {
  private readonly api = inject(BiometricConfigApi);
  private readonly fb = inject(FormBuilder);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  status = signal<BiometricStatus | null>(null);
  checking = signal(false);

  form = this.fb.group({
    ip: ['', [Validators.required]],
    port: [4370, [Validators.required, Validators.min(1)]],
    timeout: [5000, [Validators.required, Validators.min(1000)]],
    inport: [5200, [Validators.required, Validators.min(1)]],
    isActive: [true],
  });

  constructor() {
    this.load();
    this.checkStatus();
  }

  load() {
    this.loading.set(true);
    this.api.get().subscribe({
      next: (config) => {
        if (config) {
          this.form.patchValue(config);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la configuración del biométrico.');
        this.loading.set(false);
      },
    });
  }

  checkStatus() {
    this.checking.set(true);
    this.api.status().subscribe({
      next: (data) => {
        this.status.set(data);
        this.checking.set(false);
      },
      error: () => {
        this.status.set(null);
        this.checking.set(false);
      },
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    const payload = this.form.value as BiometricConfig;
    this.api.update(payload).subscribe({
      next: () => {
        this.success.set('Configuración guardada correctamente.');
        this.checkStatus();
        this.saving.set(false);
      },
      error: () => {
        this.error.set('No se pudo guardar la configuración.');
        this.saving.set(false);
      },
    });
  }
}
