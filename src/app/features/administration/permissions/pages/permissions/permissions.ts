import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardEmptyComponent } from '@/shared/components/empty';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionStore } from '../../../services/store/permission.store';
import { Permission } from '../../../services/api/permission-api';

import { DialogModalService } from '@shared/widgets/dialog-modal';
import { PermissionCardComponent } from '../../components/permission-card/permission-card';
import { PermissionForm } from '../../components/permission-form/permission-form';

interface ModuleGroup {
  name: string;
  permissions: Permission[];
}

@Component({
  selector: 'sga-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    PermissionCardComponent,
    ZardEmptyComponent,
    ZardIconComponent,
  ],
  templateUrl: './permissions.html',
  styles: [
    `
      :host {
        display: block;
        padding: 1.5rem;
      }
      .module-card {
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }
      .module-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PermissionsComponent implements OnInit {
  private dialog = inject(DialogModalService);
  public store = inject(PermissionStore);

  public searchTerm = signal('');
  public loading = computed(() => this.store.loading());

  public groupedPermissions = computed(() => {
    const all = this.store.permissions();
    const search = this.searchTerm().toLowerCase();

    // Filter
    const filtered = all.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search) ||
        p.module.toLowerCase().includes(search),
    );

    // Group
    const groups: Record<string, Permission[]> = {};
    filtered.forEach((p) => {
      const mod = p.module || 'General';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });

    return Object.keys(groups)
      .sort()
      .map((name) => ({
        name,
        permissions: groups[name],
      })) as ModuleGroup[];
  });

  ngOnInit() {
    this.store.loadAll({ size: 100 });
  }

  openCreateDialog() {
    this.openForm();
  }

  editPermission(permission: Permission) {
    this.openForm(permission);
  }

  private openForm(current: Permission | null = null) {
    const ref = this.dialog.open<Partial<Permission>>(PermissionForm, {
      data: { current },
      panelClass: 'dialog-top',
      width: '600px',
    });

    ref.closed.subscribe((result) => {
      if (!result) return;
      if (current) {
        this.store.update(current.id, result).subscribe(() => this.store.loadAll({ size: 100 }));
      } else {
        this.store.create(result).subscribe(() => this.store.loadAll({ size: 100 }));
      }
    });
  }

  deletePermission(permission: Permission) {
    this.store.delete(permission.id).subscribe();
  }
}
