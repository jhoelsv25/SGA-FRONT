import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleStore } from '../../../services/store/role.store';
import { Button } from '@shared/directives';
import { Role } from '../../../services/api/role-api';
import { Dialog } from '@angular/cdk/dialog';
import { RoleCardComponent } from '../../components/role-card/role-card';
import { RoleForm } from '../../components/role-form/role-form';
import { Router } from '@angular/router';
import { EmptyState } from '@shared/ui/empty-state/empty-state';

@Component({
  selector: 'sga-roles',
  standalone: true,
  imports: [CommonModule, Button, RoleCardComponent, EmptyState],
  templateUrl: './roles.html',
  styles: [`
    :host { display: block; padding: 1.5rem; }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RolesComponent implements OnInit {
  private dialog = inject(Dialog);
  private router = inject(Router);
  public store = inject(RoleStore);
  
  public roles = computed(() => this.store.roles());
  public loading = computed(() => this.store.loading());

  ngOnInit() {
    this.store.loadAll();
  }

  selectRole(role: Role) {
    this.router.navigate(['/administration/roles', role.id]);
  }

  openCreateDialog() {
    this.openForm();
  }

  editRole(role: Role) {
    this.openForm(role);
  }

  private openForm(current: Role | null = null) {
    const ref = this.dialog.open<Partial<Role>>(RoleForm, {
      data: { current },
      panelClass: 'dialog-top',
      width: '500px',
    });

    ref.closed.subscribe((result) => {
      if (!result) return;
      if (current) {
        this.store.update(current.id, result).subscribe();
      } else {
        this.store.create(result).subscribe();
      }
    });
  }

  deleteRole(role: Role) {
    if (confirm(`¿Estás seguro de eliminar el rol ${role.name}?`)) {
        this.store.delete(role.id);
    }
  }
}
