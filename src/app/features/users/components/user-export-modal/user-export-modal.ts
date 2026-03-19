import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardFormImports } from '@/shared/components/form';

@Component({
  selector: 'sga-user-export-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCheckboxComponent,
    SelectOptionComponent,
    ...ZardFormImports,
  ],
  templateUrl: './user-export-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserExportModal implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);

  public step = signal<1 | 2>(1);
  public isExporting = signal(false);

  // Paso 1: Filtros
  public filterSearch = signal('');
  public filterRole = signal('');

  public rolesFilter = [
    { value: '', label: 'Todos' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'student', label: 'Estudiante' }
  ];

  // Paso 2: Columnas
  public columns = signal([
    { key: 'username', label: 'Nombre de usuario', selected: true },
    { key: 'firstName', label: 'Nombre', selected: true },
    { key: 'lastName', label: 'Apellido', selected: true },
    { key: 'email', label: 'Correo', selected: true },
    { key: 'roleName', label: 'Rol', selected: true },
    { key: 'lastLogin', label: 'Última sesión', selected: true },
    { key: 'isActive', label: 'Estado activo', selected: true },
    { key: 'createdAt', label: 'Fecha de registro', selected: true },
  ]);

  ngOnInit() {
    if (this.data) {
      if (this.data.filterSearch) this.filterSearch.set(this.data.filterSearch);
      if (this.data.filterRole) this.filterRole.set(this.data.filterRole);
    }
  }

  nextStep() {
    this.step.set(2);
  }

  prevStep() {
    this.step.set(1);
  }

  toggleColumn(idx: number, checked: boolean) {
    const cols = [...this.columns()];
    cols[idx] = { ...cols[idx], selected: checked };
    this.columns.set(cols);
  }

  toggleAll(checked: boolean) {
    this.columns.set(this.columns().map(c => ({ ...c, selected: checked })));
  }

  get allSelected() {
    return this.columns().every(c => c.selected);
  }

  exportData() {
    if (!this.columns().some(c => c.selected)) return;
    this.isExporting.set(true);

    const payload = {
      search: this.filterSearch(),
      role: this.filterRole(),
      columns: this.columns().filter(c => c.selected).map(c => c.key),
    };

    // Simulated download, frontend needs endpoint to return binary blob logic.
    console.log('Export dispatch:', payload);
    setTimeout(() => {
      this.isExporting.set(false);
      this.ref.close(payload);
    }, 1200);
  }

  close() {
    this.ref.close();
  }
}
