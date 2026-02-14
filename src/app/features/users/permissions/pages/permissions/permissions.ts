
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-permissions',
  standalone: true,
  imports: [CommonModule],
  template: '<h1>Permisos</h1><p>Gestión de permisos.</p>',
  styles: [':host { display: block; }']
})
export default class PermissionsComponent {}
