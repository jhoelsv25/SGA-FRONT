
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-sessions',
  standalone: true,
  imports: [CommonModule],
  template: '<h1>Sesiones activas</h1><p>Gestión de sesiones.</p>',
  styles: [':host { display: block; }']
})
export default class SessionsComponent {}
