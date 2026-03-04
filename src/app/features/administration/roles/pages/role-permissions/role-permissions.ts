import { ChangeDetectionStrategy, Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoleStore } from '../../../services/store/role.store';
import { PermissionApi, Permission } from '../../../services/api/permission-api';
import { Button } from '@shared/directives';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { PermissionGroupCardComponent } from '../../components/permission-group-card/permission-group-card';
import { getModuleIcon } from '../../utils/icons.util';

interface PermissionGroup {
  module: string;
  icon: string;
  permissions: Permission[];
}

@Component({
  selector: 'sga-role-permissions',
  standalone: true,
  imports: [CommonModule, Button, RouterModule, FormsModule, EmptyState, PermissionGroupCardComponent],
  templateUrl: './role-permissions.html',
  styles: [`
    :host { display: block; padding: 1.5rem; }
    .module-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RolePermissionsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public store = inject(RoleStore);
  private permissionApi = inject(PermissionApi);
  
  public roleId = signal<string | null>(null);
  public searchTerm = signal('');
  public allPermissions = signal<Permission[]>([]);
  public checkedPermissions = signal<Set<string>>(new Set());

  public groupedByModule = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const perms = this.allPermissions().filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.slug.toLowerCase().includes(search) ||
      p.module?.toLowerCase().includes(search)
    );

    const groups: Record<string, Permission[]> = {};
    perms.forEach(p => {
      let moduleName = p.module || 'General';
      // If module is empty but name has "Module - Action", use that
      if (!p.module && p.name.includes(' - ')) {
        moduleName = p.name.split(' - ')[0];
      }
      
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(p);
    });

    return Object.keys(groups).sort().map(name => ({
      module: name,
      icon: getModuleIcon(name),
      permissions: groups[name].sort((a, b) => a.name.localeCompare(b.name))
    }));
  });

  constructor() {
    effect(() => {
      const selectedRole = this.store.selectedRole();
      if (selectedRole && selectedRole.permissions) {
        const perms = new Set<string>();
        const rolePermissions = (selectedRole as { permissions?: (string | { id: string })[] }).permissions || [];
        rolePermissions.forEach((p: string | { id: string }) => {
          if (typeof p === 'string') perms.add(p);
          else if (p.id) perms.add(p.id);
        });
        this.checkedPermissions.set(perms);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.roleId.set(id);
        this.store.selectRoleById(id);
      }
    });

    this.permissionApi.getAll({ size: 1000 }).subscribe(res => {
      this.allPermissions.set(res.data);
    });
  }

  togglePermission(id: string) {
    const set = new Set(this.checkedPermissions());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.checkedPermissions.set(set);
  }

  toggleModule(group: PermissionGroup, checked: boolean) {
    const set = new Set(this.checkedPermissions());
    group.permissions.forEach(p => {
      if (checked) set.add(p.id);
      else set.delete(p.id);
    });
    this.checkedPermissions.set(set);
  }

  isPermissionChecked(id: string): boolean {
    return this.checkedPermissions().has(id);
  }

  savePermissions() {
    const id = this.roleId();
    if (!id) return;
    
    const permissionIds = Array.from(this.checkedPermissions());
    this.store.updatePermissions(id, permissionIds).subscribe(() => {
        this.goBack();
    });
  }

  goBack() {
    this.router.navigate(['/administration/roles']);
  }
}
