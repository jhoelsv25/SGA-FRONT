import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLog } from '@features/administration/services/api/audit-api';


@Component({
  selector: 'sga-audit-log-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogItem {
  log = input.required<AuditLog>();
  expanded = signal(false);

  getActionIcon(): string {
    switch (this.log().action) {
      case 'CREATE': return 'fas fa-plus';
      case 'UPDATE': return 'fas fa-pen';
      case 'DELETE': return 'fas fa-trash';
      default: return 'fas fa-circle-info';
    }
  }

  getActionClass(): string {
    switch (this.log().action) {
      case 'CREATE': return 'bg-success/10 text-success border border-success/20';
      case 'UPDATE': return 'bg-info/10 text-info border border-info/20';
      case 'DELETE': return 'bg-error/10 text-error border border-error/20';
      default: return 'bg-base-200 text-base-content/50 border border-base-200';
    }
  }

  getEntityClass(): string {
    const entities: Record<string, string> = {
      'users': 'text-blue-500 bg-blue-500/5 border-blue-500/10',
      'roles': 'text-purple-500 bg-purple-500/5 border-purple-500/10',
      'permissions': 'text-amber-500 bg-amber-500/5 border-amber-500/10',
      'institution': 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
    };
    return entities[this.log().entity.toLowerCase()] || 'text-base-content/40 bg-base-100 border-base-200';
  }

  getChanges() {
    if (!this.log().before || !this.log().after) return [];
    
    const before = this.log().before;
    const after = this.log().after;
    const changes: { field: string; old: unknown; new: unknown }[] = [];

    Object.keys(after).forEach(key => {
      // Avoid technical fields if possible
      if (['updatedAt', 'password'].includes(key)) return;
      
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push({
          field: key,
          old: before[key] ?? 'N/A',
          new: after[key] ?? 'N/A'
        });
      }
    });

    return changes;
  }
}
