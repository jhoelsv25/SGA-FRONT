
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: '<h1>Auditoría</h1><p>Registro de auditoría.</p>',
  styles: [':host { display: block; }']
})
export default class AuditLogsComponent {}
