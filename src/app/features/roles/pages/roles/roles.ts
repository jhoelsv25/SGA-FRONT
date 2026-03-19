import { ZardEmptyComponent } from '@/shared/components/empty';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleStore } from '@features/admin-services/store/role.store';
import { Role } from '@features/admin-services/api/role-api';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { RoleCardComponent } from '../../components/role-card/role-card';
import { RoleForm } from '../../components/role-form/role-form';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermissionStore } from '@features/admin-services/store/permission.store';
import { Permission } from '@features/admin-services/api/permission-api';
import { PermissionForm } from '../../../permissions/components/permission-form/permission-form';
import PermissionsComponent from '../../../permissions/pages/permissions/permissions';
import { RolePermissionHeaderComponent } from '../../components/header/header';

@Component({
  selector: 'sga-roles',
  standalone: true,
  imports: [
    CommonModule,
    RoleCardComponent,
    ZardEmptyComponent,
    PermissionsComponent,
    RolePermissionHeaderComponent,
  ],
  templateUrl: './roles.html',
  styles: [
    `
      :host {
        display: block;
        padding: 1.5rem;
      }
      .roles-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        max-width: 80rem;
        margin: 0 auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RolesComponent implements OnInit {
  private dialog = inject(DialogModalService);
  private router = inject(Router);
  public store = inject(RoleStore);
  public permissionStore = inject(PermissionStore);
  
  public activeTab = signal<'roles' | 'permissions'>('roles');
  public searchTerm = signal('');

  public roles = computed(() => {
    const list = this.store.roles();
    const search = this.searchTerm().toLowerCase();
    if (!search) return list;
    return list.filter(r => 
      r.name.toLowerCase().includes(search) || 
      r.description?.toLowerCase().includes(search)
    );
  });
  
  public loading = computed(() => this.store.loading());

  public headerInfo = computed(() => {
    if (this.activeTab() === 'roles') {
      return {
        title: 'Roles de Sistema',
        description: 'Gestión de Perfiles y Niveles',
        buttonText: 'NUEVO ROL',
        icon: 'fa-shield-halved',
        placeholder: 'Filtrar roles activos...'
      };
    }
    return {
      title: 'Diccionario Técnico',
      description: 'Capacidades Granulares del Core',
      buttonText: 'NUEVO PERMISO',
      icon: 'fa-key',
      placeholder: 'Buscar técnicos, módulos o slugs...'
    };
  });
  
  // Tab Switch logic to clear search
  setTab(tab: 'roles' | 'permissions') {
    this.activeTab.set(tab);
    // Optional: search persistence? No, clear it for fresh view if you want.
    // this.searchTerm.set('');
  }

  ngOnInit() {
    this.store.loadAll();
    this.permissionStore.loadAll({ size: 100 });
  }

  handleCreate() {
    if (this.activeTab() === 'roles') {
      this.openRoleForm();
    } else {
      this.openPermissionForm();
    }
  }

  // ROLES LOGIC
  selectRole(role: Role) {
    this.router.navigate(['/administration/roles', role.id]);
  }

  public openRoleForm(current: Role | null = null) {
    const ref = this.dialog.open<Partial<Role>>(RoleForm, {
      data: { current },
      panelClass: 'dialog-top',
      width: '500px',
    });

    ref.closed.subscribe((result: any) => {
      if (!result) return;
      if (current) {
        this.store.update(current.id, result).subscribe();
      } else {
        this.store.create(result).subscribe();
      }
    });
  }

  // PERMISSIONS LOGIC
  public openPermissionForm(current: Permission | null = null) {
    const ref = this.dialog.open<Partial<Permission>>(PermissionForm, {
      data: { current },
      panelClass: 'dialog-top',
      width: '600px',
    });

    ref.closed.subscribe((result: any) => {
      if (!result) return;
      if (current) {
        this.permissionStore.update(current.id, result).subscribe(() => this.permissionStore.loadAll({ size: 100 }));
      } else {
        this.permissionStore.create(result).subscribe(() => this.permissionStore.loadAll({ size: 100 }));
      }
    });
  }

  deleteRole(role: Role) {
    this.store.delete(role.id);
  }
}
