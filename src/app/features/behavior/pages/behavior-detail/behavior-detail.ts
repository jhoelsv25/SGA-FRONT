import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { BehaviorApi } from '../../services/behavior-api';
import type { Behavior } from '../../types/behavior-types';
import { BehaviorForm } from '../../components/behavior-form/behavior-form';

@Component({
  selector: 'sga-behavior-detail',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './behavior-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BehaviorDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly behaviorApi = inject(BehaviorApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly behavior = signal<Behavior | null>((history.state?.behavior as Behavior | undefined) ?? null);
  readonly loading = signal(true);

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      incident: 'Incidencia',
      achievement: 'Logro',
      observation: 'Observación',
      other: 'Otro',
    };
    return map[this.behavior()?.type ?? ''] ?? (this.behavior()?.type || 'Sin tipo');
  });

  readonly severityLabel = computed(() => {
    const map: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica',
    };
    return map[this.behavior()?.severity ?? ''] ?? (this.behavior()?.severity || 'Sin nivel');
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/behavior/records']);
      return;
    }
    this.loadBehavior(id);
  }

  goBack(): void {
    this.router.navigate(['/behavior/records']);
  }

  openEdit(): void {
    const current = this.behavior();
    if (!current) return;
    this.dialog.open(BehaviorForm, {
      data: { current },
      width: '520px',
      maxHeight: '80vh',
    }).closed.subscribe(() => this.reload());
  }

  deleteCurrent(): void {
    const current = this.behavior();
    if (!current) return;
    this.behaviorApi.delete(current.id).subscribe({
      next: () => {
        this.toast.success('Registro eliminado');
        this.router.navigate(['/behavior/records']);
      },
      error: (error) => {
        this.toast.error('No se pudo eliminar el registro', { description: error?.message });
      },
    });
  }

  private reload(): void {
    const id = this.behavior()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadBehavior(id);
  }

  private loadBehavior(id: string): void {
    this.loading.set(true);
    this.behaviorApi.getById(id).subscribe({
      next: (res) => {
        this.behavior.set(res.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar el registro', { description: error?.message });
        this.router.navigate(['/behavior/records']);
      },
    });
  }
}
