import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleStore } from '../../../services/store/role.store';
import { Role } from '../../../services/api/role-api';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { RoleCardComponent } from '../../components/role-card/role-card';
import { RoleForm } from '../../components/role-form/role-form';
import { Router } from '@angular/router';

@Component({
  selector: 'sga-roles',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    RoleCardComponent,
    ZardEmptyComponent,
    ZardIconComponent,
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
    this.store.delete(role.id);
  }
}
