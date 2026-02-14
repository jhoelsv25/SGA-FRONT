
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-roles',
  standalone: true,
  imports: [CommonModule],
  template: '<h1>Roles</h1><p>Gestión de roles.</p>',
  styles: [':host { display: block; }']
})
export default class RolesComponent {}
